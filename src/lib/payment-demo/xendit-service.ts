/**
 * Xendit mode for the Payment & Subscription demo.
 *
 * Flow: checkout creates a PENDING invoice row + a Xendit invoice → the visitor
 * pays on Xendit's hosted page → Xendit calls our webhook (or we reconcile via
 * GET /v2/invoices when they return) → `applyPaid` activates/updates the
 * subscription exactly once.
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
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
  type PlanId,
  type Quote,
  type Subscription,
  type WebhookEventType,
  type XenditDemoState,
} from "@/lib/payment-demo/billing";
import { invoiceNumber, newId } from "@/lib/payment-demo/server";
import {
  createXenditInvoice,
  expireXenditInvoice,
  getXenditInvoice,
  type XenditInvoice,
} from "@/lib/payment-demo/xendit";

const INVOICE_DURATION_SECONDS = 60 * 60; // 1 hour payment window
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
  };
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

/** Subscriptions set to cancel end once their period is over (evaluated lazily). */
async function endLapsedSubscription(customerId: string) {
  const sub = await activeSubscription(db, customerId);
  if (!sub || !sub.cancelAtPeriodEnd || sub.currentPeriodEnd > new Date()) return;
  await db.transaction(async (tx) => {
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
        ended_at: sub.currentPeriodEnd.toISOString(),
      });
    }
  });
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
}): Promise<{ invoiceUrl: string | null }> {
  const { customerId, origin, quote, reason, lines } = params;
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
    })
    .returning();

  // Fully covered by proration credit — nothing to collect.
  if (quote.total === 0) {
    await applyPaid(externalId, { paidAt: now, method: "CREDIT", channel: "CREDIT" });
    return { invoiceUrl: null };
  }

  let xendit: XenditInvoice;
  try {
    const plan = getPlan(quote.planId);
    const back = `${origin}${DEMO_PATH}?mode=xendit&checkout=`;
    xendit = await createXenditInvoice({
      externalId,
      amount: quote.total,
      description: `Porto AI demo — ${plan.name} plan (${quote.cycle}) · ${row.number}`,
      invoiceDuration: INVOICE_DURATION_SECONDS,
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

export async function getXenditDemoState(customerId: string): Promise<XenditDemoState> {
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
  origin: string
) {
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
    reason: quote.kind === "new" ? "subscription_create" : "subscription_update",
  });
}

/**
 * Invoice-based renewal: issue the next period's invoice for the visitor to pay
 * (in production a scheduled job does this a few days before period end).
 */
export async function startRenewal(customerId: string, origin: string) {
  const sub = await activeSubscription(db, customerId);
  if (!sub || sub.cancelAtPeriodEnd) throw new PaymentDemoError("invalid_change");

  const planId = (sub.scheduledPlanId ?? sub.planId) as PlanId;
  const cycle = (sub.scheduledCycle ?? sub.cycle) as BillingCycle;
  const quote = quoteRenewal(planId, cycle, sub.currentPeriodEnd);

  return openInvoice({
    customerId,
    origin,
    quote,
    reason: "subscription_cycle",
    lines: [{ description: `${getPlan(planId).name} plan (${cycle})`, amount: quote.price }],
  });
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
