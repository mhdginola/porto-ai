/**
 * Xendit mode for the Payment & Subscription demo.
 *
 * Flow: checkout creates a PENDING invoice row + a Xendit invoice → the visitor
 * pays on Xendit's hosted page → Xendit calls our webhook (or we reconcile via
 * GET /v2/invoices when they return) → `applyPaid` activates/updates the
 * subscription exactly once.
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  paymentEvents,
  paymentInvoices,
  paymentSubscriptions,
  type PaymentInvoiceRow,
  type PaymentSubscriptionRow,
} from "@/lib/db/schema";
import {
  addCycle,
  classifyChange,
  getPlan,
  quoteChange,
  quoteRenewal,
  type BillingCycle,
  type Invoice,
  type CryptoQuote,
  type PaymentRail,
  type PlanId,
  type Quote,
  type Subscription,
  type WebhookEventType,
  type XenditDemoState,
} from "@/lib/payment-demo/billing";
import {
  daysFromNow,
  entitlementFor,
  GRACE_DAYS,
  RENEWAL_LEAD_DAYS,
  type Entitlement,
} from "@/lib/payment-demo/entitlements";
import { invoiceNumber, newId } from "@/lib/payment-demo/server";
import {
  checkSettlement,
  cryptoChannelLabel,
  cryptoRailInfo,
  explorerTxUrl,
  isCryptoEnabled,
  onchainInvoiceId,
  signQuote,
} from "@/lib/payment-demo/crypto";
import {
  createXenditInvoice,
  expireXenditInvoice,
  getXenditInvoice,
  isXenditEnabled,
  type XenditInvoice,
} from "@/lib/payment-demo/xendit";

const CHECKOUT_INVOICE_SECONDS = 60 * 60; // 1 hour to finish a checkout
const DEMO_PATH = "/projects/payment-subscription-demo";

export class PaymentDemoError extends Error {
  constructor(
    readonly code: string,
    readonly status = 400
  ) {
    super(code);
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = typeof db | Tx;


/* ---------------- mapping ---------------- */

function toSubscription(row: PaymentSubscriptionRow): Subscription {
  return {
    id: row.id,
    planId: row.planId as PlanId,
    cycle: row.cycle as BillingCycle,
    status: "active",
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    currentPeriodStart: row.currentPeriodStart.toISOString(),
    currentPeriodEnd: row.currentPeriodEnd.toISOString(),
  };
}

function toInvoice(row: PaymentInvoiceRow): Invoice {
  const status =
    row.status === "PAID" ? "paid" : row.status === "PENDING" ? "pending" : "expired";
  return {
    id: row.id,
    number: row.number,
    createdAt: (row.paidAt ?? row.createdAt).toISOString(),
    reason: row.reason as Invoice["reason"],
    lines: row.lines,
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    status,
    channel: row.paymentChannel,
    payUrl: status === "pending" ? row.invoiceUrl : null,
    rail: row.rail as PaymentRail,
    cryptoQuote:
      row.rail === "crypto" && status === "pending" && row.railData?.quote
        ? row.railData.quote
        : null,
    txUrl: row.railData?.txHash ? explorerTxUrl(row.railData.txHash) : null,
  };
}

/** Rails available on this server (Xendit and/or stablecoin). */
export function isLiveBillingEnabled(): boolean {
  return isXenditEnabled() || isCryptoEnabled();
}

export function resolveRail(requested?: PaymentRail): PaymentRail {
  if (requested === "crypto" && isCryptoEnabled()) return "crypto";
  if (requested === "xendit" && isXenditEnabled()) return "xendit";
  if (requested) throw new PaymentDemoError("rail_unavailable");
  return isXenditEnabled() ? "xendit" : "crypto";
}

/* ---------------- helpers ---------------- */

async function logEvent(
  ex: Executor,
  customerId: string,
  type: WebhookEventType,
  data: Record<string, unknown>,
  dedupeKey?: string
) {
  await ex
    .insert(paymentEvents)
    .values({ id: newId("evt"), customerId, type, data, dedupeKey })
    .onConflictDoNothing();
}

async function activeSubscription(ex: Executor, customerId: string) {
  const [row] = await ex
    .select()
    .from(paymentSubscriptions)
    .where(
      and(
        eq(paymentSubscriptions.customerId, customerId),
        eq(paymentSubscriptions.status, "active")
      )
    )
    .limit(1);
  return row ?? null;
}

function snapshot(row: PaymentSubscriptionRow | null) {
  return row
    ? {
        planId: row.planId as PlanId,
        cycle: row.cycle as BillingCycle,
        currentPeriodStart: row.currentPeriodStart.toISOString(),
        currentPeriodEnd: row.currentPeriodEnd.toISOString(),
      }
    : null;
}

/**
 * End a subscription whose paid time is over: cancelled at period end, or the
 * renewal went unpaid past the grace period. Evaluated lazily on read and by the
 * renewal job. Returns true if it ended now.
 */
async function endIfLapsed(sub: PaymentSubscriptionRow, now = new Date()): Promise<boolean> {
  if (sub.status !== "active") return false;
  if (entitlementFor({ ...sub, planId: sub.planId as PlanId }, now).planId !== "free") {
    return false;
  }
  const customerId = sub.customerId;
  const reason = sub.cancelAtPeriodEnd ? "cancelled" : "unpaid";
  return db.transaction(async (tx) => {
    const [ended] = await tx
      .update(paymentSubscriptions)
      .set({ status: "ended", updatedAt: new Date() })
      .where(
        and(eq(paymentSubscriptions.id, sub.id), eq(paymentSubscriptions.status, "active"))
      )
      .returning();
    if (ended) {
      await logEvent(tx, customerId, "customer.subscription.deleted", {
        subscription: sub.id,
        plan: sub.planId,
        reason,
        ended_at: sub.currentPeriodEnd.toISOString(),
      });
    }
    return !!ended;
  });
}

async function endLapsedSubscription(customerId: string) {
  const sub = await activeSubscription(db, customerId);
  if (sub) await endIfLapsed(sub);
}

/** Only one open payment link per visitor: supersede older ones. */
async function expirePendingInvoices(customerId: string) {
  const pending = await db
    .update(paymentInvoices)
    .set({ status: "EXPIRED" })
    .where(
      and(eq(paymentInvoices.customerId, customerId), eq(paymentInvoices.status, "PENDING"))
    )
    .returning();
  for (const inv of pending) {
    await logEvent(db, customerId, "invoice.expired", {
      invoice: inv.id,
      number: inv.number,
      reason: "superseded",
    });
    if (inv.xenditInvoiceId) {
      // Best effort — if it was paid meanwhile, the PAID callback still wins.
      await expireXenditInvoice(inv.xenditInvoiceId).catch(() => {});
    }
  }
}

async function openInvoice(params: {
  customerId: string;
  origin: string;
  quote: Quote;
  reason: Invoice["reason"];
  lines: Invoice["lines"];
  /** Payment window in seconds (defaults to 1 hour for interactive checkout). */
  durationSeconds?: number;
  rail: PaymentRail;
}): Promise<{ invoiceUrl: string | null; crypto?: CryptoQuote; invoiceId?: string }> {
  const { customerId, origin, quote, reason, lines, rail } = params;
  await expirePendingInvoices(customerId);

  const now = new Date();
  const externalId = `porto-pay-${randomUUID()}`;
  const [row] = await db
    .insert(paymentInvoices)
    .values({
      id: newId("in"),
      customerId,
      externalId,
      number: invoiceNumber(now),
      reason,
      planId: quote.planId,
      cycle: quote.cycle,
      lines,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      status: "PENDING",
      rail,
    })
    .returning();

  // Fully covered by proration credit — nothing to collect.
  if (quote.total === 0) {
    await applyPaid(externalId, { paidAt: now, method: "CREDIT", channel: "CREDIT" });
    return { invoiceUrl: null };
  }

  const duration = params.durationSeconds ?? CHECKOUT_INVOICE_SECONDS;

  if (rail === "crypto") {
    // The quote (amount in token units + deadline) is signed now; the contract
    // will only accept exactly this payment for this invoice.
    const cryptoQuote = await signQuote(externalId, quote.total, duration);
    await db
      .update(paymentInvoices)
      .set({
        railData: { quote: cryptoQuote },
        expiresAt: new Date(cryptoQuote.deadline * 1000),
      })
      .where(eq(paymentInvoices.id, row.id));
    await logEvent(db, customerId, "invoice.created", {
      invoice: row.id,
      number: row.number,
      rail: "crypto",
      onchain_invoice_id: cryptoQuote.invoiceId,
      amount: quote.total,
      token_amount: cryptoQuote.amount,
      token: cryptoQuote.tokenSymbol,
      chain_id: cryptoQuote.chainId,
      deadline: new Date(cryptoQuote.deadline * 1000).toISOString(),
    });
    return { invoiceUrl: null, crypto: cryptoQuote, invoiceId: row.id };
  }

  let xendit: XenditInvoice;
  try {
    const plan = getPlan(quote.planId);
    const back = `${origin}${DEMO_PATH}?mode=xendit&checkout=`;
    xendit = await createXenditInvoice({
      externalId,
      amount: quote.total,
      description: `Porto AI demo — ${plan.name} plan (${quote.cycle}) · ${row.number}`,
      invoiceDuration: duration,
      successRedirectUrl: `${back}success`,
      failureRedirectUrl: `${back}failed`,
    });
  } catch (err) {
    await db.delete(paymentInvoices).where(eq(paymentInvoices.id, row.id));
    throw err;
  }

  await db
    .update(paymentInvoices)
    .set({
      xenditInvoiceId: xendit.id,
      invoiceUrl: xendit.invoice_url ?? null,
      expiresAt: xendit.expiry_date ? new Date(xendit.expiry_date) : null,
    })
    .where(eq(paymentInvoices.id, row.id));

  await logEvent(db, customerId, "invoice.created", {
    invoice: row.id,
    number: row.number,
    xendit_invoice: xendit.id,
    external_id: externalId,
    amount: quote.total,
    status: xendit.status,
    expiry_date: xendit.expiry_date,
  });

  return { invoiceUrl: xendit.invoice_url ?? null };
}

/**
 * Mark an invoice paid and apply its subscription change — exactly once, even if
 * the webhook and a reconcile run race (conditional UPDATE … RETURNING).
 */
async function applyPaid(
  externalId: string,
  info: { paidAt: Date; method?: string; channel?: string }
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [inv] = await tx
      .update(paymentInvoices)
      .set({
        status: "PAID",
        paidAt: info.paidAt,
        paymentMethod: info.method ?? null,
        paymentChannel: info.channel ?? null,
      })
      .where(
        and(
          eq(paymentInvoices.externalId, externalId),
          inArray(paymentInvoices.status, ["PENDING", "EXPIRED"])
        )
      )
      .returning();
    if (!inv) return false;

    const [current] = await tx
      .select()
      .from(paymentSubscriptions)
      .where(eq(paymentSubscriptions.customerId, inv.customerId))
      .for("update");
    const wasActive = current?.status === "active";

    // Renewals extend from the end of the current period; new plans start now.
    const start =
      inv.reason === "subscription_cycle" &&
      wasActive &&
      current.currentPeriodEnd > info.paidAt
        ? current.currentPeriodEnd
        : info.paidAt;
    const cycle = inv.cycle as BillingCycle;
    const values = {
      planId: inv.planId,
      cycle,
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodStart: start,
      currentPeriodEnd: addCycle(start, cycle),
      scheduledPlanId: null,
      scheduledCycle: null,
      paymentChannel: info.channel ?? null,
      updatedAt: new Date(),
    };

    const [sub] = await tx
      .insert(paymentSubscriptions)
      .values({ id: newId("sub"), customerId: inv.customerId, ...values })
      .onConflictDoUpdate({ target: paymentSubscriptions.customerId, set: values })
      .returning();

    await logEvent(tx, inv.customerId, "invoice.paid", {
      invoice: inv.id,
      number: inv.number,
      total: inv.total,
      payment_method: info.method,
      payment_channel: info.channel,
    });
    await logEvent(
      tx,
      inv.customerId,
      wasActive ? "customer.subscription.updated" : "customer.subscription.created",
      {
        subscription: sub.id,
        plan: sub.planId,
        cycle: sub.cycle,
        current_period_end: sub.currentPeriodEnd.toISOString(),
        ...(wasActive && { previous: { plan: current.planId, cycle: current.cycle } }),
      }
    );
    return true;
  });
}

/* ---------------- public API ---------------- */

export async function getXenditDemoState(
  customerId: string,
  account: XenditDemoState["account"] = null
): Promise<XenditDemoState> {
  await endLapsedSubscription(customerId);
  const [sub, invoices, events] = await Promise.all([
    activeSubscription(db, customerId),
    db
      .select()
      .from(paymentInvoices)
      .where(eq(paymentInvoices.customerId, customerId))
      .orderBy(desc(paymentInvoices.createdAt))
      .limit(20),
    db
      .select()
      .from(paymentEvents)
      .where(eq(paymentEvents.customerId, customerId))
      .orderBy(desc(paymentEvents.createdAt))
      .limit(60),
  ]);

  return {
    account,
    rails: { xendit: isXenditEnabled(), crypto: cryptoRailInfo() },
    subscription: sub ? toSubscription(sub) : null,
    scheduledChange:
      sub?.scheduledPlanId && sub.scheduledCycle
        ? {
            planId: sub.scheduledPlanId as PlanId,
            cycle: sub.scheduledCycle as BillingCycle,
          }
        : null,
    paymentChannel: sub?.paymentChannel ?? null,
    invoices: invoices.map(toInvoice),
    events: events.map((e) => ({
      id: e.id,
      type: e.type as WebhookEventType,
      created: e.createdAt.toISOString(),
      data: e.data,
    })),
  };
}

export async function startCheckout(
  customerId: string,
  planId: PlanId,
  cycle: BillingCycle,
  origin: string,
  requestedRail?: PaymentRail
) {
  const rail = resolveRail(requestedRail);
  await endLapsedSubscription(customerId);
  const sub = await activeSubscription(db, customerId);
  const quote = quoteChange(snapshot(sub), planId, cycle, new Date());
  if (quote.kind !== "new" && quote.kind !== "upgrade") {
    throw new PaymentDemoError("invalid_change");
  }

  const plan = getPlan(planId);
  const lines: Invoice["lines"] = [
    { description: `${plan.name} plan (${cycle})`, amount: quote.price },
  ];
  if (quote.credit > 0 && sub) {
    lines.push({
      description: `Unused time on ${getPlan(sub.planId as PlanId).name} (${sub.cycle})`,
      amount: -quote.credit,
    });
  }

  return openInvoice({
    customerId,
    origin,
    quote,
    lines,
    rail,
    reason: quote.kind === "new" ? "subscription_create" : "subscription_update",
  });
}

/** Renew on the rail the customer last paid with, if it's still available. */
function renewalRail(sub: PaymentSubscriptionRow, requested?: PaymentRail): PaymentRail {
  if (requested) return resolveRail(requested);
  const paidWithCrypto = sub.paymentChannel?.startsWith(`${cryptoRailInfo()?.tokenSymbol ?? "USDC"} ·`);
  if (paidWithCrypto && isCryptoEnabled()) return "crypto";
  return resolveRail();
}

function issueRenewal(sub: PaymentSubscriptionRow, origin: string, requested?: PaymentRail) {
  const planId = (sub.scheduledPlanId ?? sub.planId) as PlanId;
  const cycle = (sub.scheduledCycle ?? sub.cycle) as BillingCycle;
  const quote = quoteRenewal(planId, cycle, sub.currentPeriodEnd);

  // Payable until the grace period runs out (at least one hour).
  const graceEnd = sub.currentPeriodEnd.getTime() + GRACE_DAYS * 86_400_000;
  const durationSeconds = Math.max(3600, Math.floor((graceEnd - Date.now()) / 1000));

  return openInvoice({
    customerId: sub.customerId,
    origin,
    quote,
    durationSeconds,
    rail: renewalRail(sub, requested),
    reason: "subscription_cycle",
    lines: [{ description: `${getPlan(planId).name} plan (${cycle})`, amount: quote.price }],
  });
}

/** Manual trigger from the demo UI: issue the next period's invoice now. */
export async function startRenewal(customerId: string, origin: string, rail?: PaymentRail) {
  const sub = await activeSubscription(db, customerId);
  if (!sub || sub.cancelAtPeriodEnd) throw new PaymentDemoError("invalid_change");
  return issueRenewal(sub, origin, rail);
}

export type SubscriptionAction =
  | { action: "cancel" }
  | { action: "resume" }
  | { action: "schedule"; planId: PlanId; cycle: BillingCycle }
  | { action: "unschedule" };

export async function updateSubscription(customerId: string, input: SubscriptionAction) {
  const sub = await activeSubscription(db, customerId);
  if (!sub) throw new PaymentDemoError("invalid_change");

  const set: Partial<typeof paymentSubscriptions.$inferInsert> = { updatedAt: new Date() };
  let data: Record<string, unknown>;

  switch (input.action) {
    case "cancel":
      Object.assign(set, { cancelAtPeriodEnd: true, scheduledPlanId: null, scheduledCycle: null });
      data = { cancel_at_period_end: true, cancel_at: sub.currentPeriodEnd.toISOString() };
      break;
    case "resume":
      set.cancelAtPeriodEnd = false;
      data = { cancel_at_period_end: false };
      break;
    case "schedule": {
      const kind = classifyChange(snapshot(sub), input.planId, input.cycle);
      if (kind !== "downgrade" || input.planId === "free") {
        throw new PaymentDemoError("invalid_change");
      }
      Object.assign(set, {
        cancelAtPeriodEnd: false,
        scheduledPlanId: input.planId,
        scheduledCycle: input.cycle,
      });
      data = {
        pending_update: {
          plan: input.planId,
          cycle: input.cycle,
          effective_at: sub.currentPeriodEnd.toISOString(),
        },
      };
      break;
    }
    case "unschedule":
      Object.assign(set, { scheduledPlanId: null, scheduledCycle: null });
      data = { pending_update: null };
      break;
  }

  await db.transaction(async (tx) => {
    await tx.update(paymentSubscriptions).set(set).where(eq(paymentSubscriptions.id, sub.id));
    await logEvent(tx, customerId, "customer.subscription.updated", {
      subscription: sub.id,
      ...data,
    });
  });
}

/**
 * Handle an invoice status from Xendit — via webhook or reconciliation.
 * Returns false for invoices we don't know about.
 */
export async function handleXenditInvoice(
  inv: XenditInvoice,
  source: "webhook" | "reconcile"
): Promise<boolean> {
  const [local] = await db
    .select()
    .from(paymentInvoices)
    .where(eq(paymentInvoices.externalId, inv.external_id))
    .limit(1);
  if (!local) return false;
  if (local.xenditInvoiceId && local.xenditInvoiceId !== inv.id) return false;

  if (source === "webhook") {
    await logEvent(
      db,
      local.customerId,
      "xendit.invoice.callback",
      {
        id: inv.id,
        external_id: inv.external_id,
        status: inv.status,
        amount: inv.amount,
        paid_amount: inv.paid_amount,
        paid_at: inv.paid_at,
        payment_method: inv.payment_method,
        payment_channel: inv.payment_channel,
      },
      `xendit:${inv.id}:${inv.status}`
    );
  }

  if (inv.status === "PAID" || inv.status === "SETTLED") {
    const paid = inv.paid_amount ?? inv.amount;
    if (paid !== local.total) {
      console.error(
        `[payment-demo] amount mismatch for ${local.externalId}: expected ${local.total}, got ${paid}`
      );
      return true;
    }
    await applyPaid(local.externalId, {
      paidAt: inv.paid_at ? new Date(inv.paid_at) : new Date(),
      method: inv.payment_method,
      channel: inv.payment_channel,
    });
  } else if (inv.status === "EXPIRED") {
    const [expired] = await db
      .update(paymentInvoices)
      .set({ status: "EXPIRED" })
      .where(and(eq(paymentInvoices.id, local.id), eq(paymentInvoices.status, "PENDING")))
      .returning();
    if (expired) {
      await logEvent(db, local.customerId, "invoice.expired", {
        invoice: local.id,
        number: local.number,
        reason: "not_paid",
      });
    }
  }
  return true;
}

/**
 * Pull the latest status of this visitor's open invoices from Xendit. Makes the
 * demo work locally where Xendit can't reach the webhook, and doubles as the
 * usual safety net for missed callbacks.
 */
export async function reconcilePending(customerId: string) {
  const pending = await db
    .select()
    .from(paymentInvoices)
    .where(
      and(eq(paymentInvoices.customerId, customerId), eq(paymentInvoices.status, "PENDING"))
    );
  await Promise.all(
    pending
      .filter((p) => p.rail === "crypto")
      .map(async (p) => {
        try {
          await settleCryptoInvoice(p);
        } catch (err) {
          console.error("[payment-demo] crypto reconcile failed:", err);
        }
      })
  );
  await Promise.all(
    pending
      .filter((p) => p.xenditInvoiceId)
      .map(async (p) => {
        try {
          const inv = await getXenditInvoice(p.xenditInvoiceId!);
          await handleXenditInvoice(inv, "reconcile");
        } catch (err) {
          console.error("[payment-demo] reconcile failed:", err);
        }
      })
  );
}

/**
 * Check a crypto invoice on-chain and apply it once confirmed. Settlement is
 * read from the contract (`paidBy`), never trusted from the client.
 */
async function settleCryptoInvoice(
  row: PaymentInvoiceRow,
  txHash?: string
): Promise<"paid" | "unconfirmed" | "unpaid"> {
  if (row.status === "PAID") return "paid";
  const settlement = await checkSettlement(onchainInvoiceId(row.externalId));
  if (settlement.status !== "paid") return settlement.status;

  await db
    .update(paymentInvoices)
    .set({
      railData: {
        ...row.railData,
        payer: settlement.payer,
        ...(txHash && /^0x[0-9a-fA-F]{64}$/.test(txHash) && { txHash }),
      },
    })
    .where(eq(paymentInvoices.id, row.id));

  const applied = await applyPaid(row.externalId, {
    paidAt: new Date(),
    method: "CRYPTO",
    channel: cryptoChannelLabel(),
  });
  if (applied) {
    await logEvent(
      db,
      row.customerId,
      "crypto.payment.confirmed",
      {
        invoice: row.id,
        number: row.number,
        onchain_invoice_id: onchainInvoiceId(row.externalId),
        payer: settlement.payer,
        confirmed_at_block: settlement.blockNumber.toString(),
        tx: txHash ?? null,
      },
      `crypto:${row.externalId}`
    );
  }
  return "paid";
}

/** Called by the browser after its payment transaction; safe to call repeatedly. */
export async function confirmCryptoInvoice(
  customerId: string,
  invoiceId: string,
  txHash?: string
): Promise<"paid" | "unconfirmed" | "unpaid"> {
  const [row] = await db
    .select()
    .from(paymentInvoices)
    .where(and(eq(paymentInvoices.id, invoiceId), eq(paymentInvoices.customerId, customerId)))
    .limit(1);
  if (!row || row.rail !== "crypto") throw new PaymentDemoError("not_found", 404);
  return settleCryptoInvoice(row, txHash);
}

/** Effective plan for a customer — what feature gates should check. */
export async function getEntitlement(customerId: string): Promise<Entitlement> {
  const sub = await activeSubscription(db, customerId);
  return entitlementFor(sub && { ...sub, planId: sub.planId as PlanId });
}

export type RenewalJobResult = {
  scanned: number;
  ended: number;
  invoiced: number;
  skipped: number;
  failed: number;
};

const RENEWAL_BATCH = 50;

/**
 * Daily billing job (Vercel Cron → /api/cron/payment-renewals):
 * - ends subscriptions that were cancelled or stayed unpaid past the grace period;
 * - issues the next period's Xendit invoice RENEWAL_LEAD_DAYS before period end.
 * Idempotent: a subscription with an open invoice is skipped, so re-runs are safe.
 */
export async function runRenewalJob(origin: string): Promise<RenewalJobResult> {
  const now = new Date();
  const due = await db
    .select()
    .from(paymentSubscriptions)
    .where(
      and(
        eq(paymentSubscriptions.status, "active"),
        lte(paymentSubscriptions.currentPeriodEnd, daysFromNow(RENEWAL_LEAD_DAYS, now))
      )
    )
    .orderBy(paymentSubscriptions.currentPeriodEnd)
    .limit(RENEWAL_BATCH);

  const result: RenewalJobResult = {
    scanned: due.length,
    ended: 0,
    invoiced: 0,
    skipped: 0,
    failed: 0,
  };

  for (const sub of due) {
    try {
      if (await endIfLapsed(sub, now)) {
        result.ended++;
        continue;
      }
      if (sub.cancelAtPeriodEnd) {
        result.skipped++;
        continue;
      }
      const [open] = await db
        .select({ id: paymentInvoices.id })
        .from(paymentInvoices)
        .where(
          and(
            eq(paymentInvoices.customerId, sub.customerId),
            eq(paymentInvoices.status, "PENDING")
          )
        )
        .limit(1);
      if (open) {
        result.skipped++;
        continue;
      }
      await issueRenewal(sub, origin);
      result.invoiced++;
    } catch (err) {
      result.failed++;
      console.error(`[payment-demo] renewal job failed for ${sub.id}:`, err);
    }
  }
  return result;
}
