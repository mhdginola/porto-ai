/**
 * Plan catalog + billing math for the Payment & Subscription demo.
 * Shared by the client (price previews) and the mock gateway API routes
 * (authoritative charge amounts) so both always agree.
 */
import type { Locale } from "@/lib/i18n/types";

export type PlanId = "free" | "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

type L = Record<Locale, string>;

export type Plan = {
  id: PlanId;
  name: string;
  rank: number;
  /** IDR, tax-exclusive */
  price: Record<BillingCycle, number>;
  tagline: L;
  features: Record<Locale, readonly string[]>;
  popular?: boolean;
};

export const TAX_RATE = 0.11; // PPN 11%

export const PLANS: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    rank: 0,
    price: { monthly: 0, yearly: 0 },
    tagline: {
      en: "For trying things out.",
      id: "Untuk mencoba-coba.",
    },
    features: {
      en: ["1 project", "100 API calls / day", "Community support"],
      id: ["1 proyek", "100 panggilan API / hari", "Dukungan komunitas"],
    },
  },
  {
    id: "pro",
    name: "Pro",
    rank: 1,
    price: { monthly: 99_000, yearly: 990_000 },
    tagline: {
      en: "For freelancers and small teams.",
      id: "Untuk freelancer dan tim kecil.",
    },
    features: {
      en: [
        "10 projects",
        "10,000 API calls / day",
        "Custom domain",
        "Email support",
      ],
      id: [
        "10 proyek",
        "10.000 panggilan API / hari",
        "Domain kustom",
        "Dukungan email",
      ],
    },
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    rank: 2,
    price: { monthly: 299_000, yearly: 2_990_000 },
    tagline: {
      en: "For growing companies.",
      id: "Untuk perusahaan yang berkembang.",
    },
    features: {
      en: [
        "Unlimited projects",
        "Unlimited API calls",
        "SSO & audit log",
        "Priority support (SLA 4h)",
      ],
      id: [
        "Proyek tanpa batas",
        "Panggilan API tanpa batas",
        "SSO & audit log",
        "Dukungan prioritas (SLA 4 jam)",
      ],
    },
  },
];

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

export function planPrice(id: PlanId, cycle: BillingCycle): number {
  return getPlan(id).price[cycle];
}

/** Add one billing cycle, clamping the day (e.g. Jan 31 + 1 month → Feb 28). */
export function addCycle(from: Date, cycle: BillingCycle): Date {
  const d = new Date(from);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  if (cycle === "monthly") d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setUTCFullYear(d.getUTCFullYear() + 1);
  const lastDay = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)
  ).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

/** The subset of a subscription that pricing depends on. */
export type SubscriptionSnapshot = {
  planId: PlanId;
  cycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
};

export type ChangeKind = "new" | "upgrade" | "downgrade" | "same";

/**
 * Upgrades (higher tier, or monthly → yearly) are charged now with proration.
 * Everything else — lower tier, or any yearly → monthly switch — is scheduled for
 * the end of the period, so unused prepaid time is never forfeited.
 */
export function classifyChange(
  current: SubscriptionSnapshot | null,
  planId: PlanId,
  cycle: BillingCycle
): ChangeKind {
  const target = getPlan(planId);
  if (!current || current.planId === "free") {
    return target.id === "free" ? "same" : "new";
  }
  const from = getPlan(current.planId);
  if (from.id === target.id && current.cycle === cycle) return "same";
  if (current.cycle === "yearly" && cycle === "monthly") return "downgrade";
  if (target.rank > from.rank) return "upgrade";
  if (target.rank < from.rank) return "downgrade";
  return cycle === "yearly" ? "upgrade" : "downgrade";
}

export type Quote = {
  kind: ChangeKind;
  planId: PlanId;
  cycle: BillingCycle;
  price: number;
  /** Credit for unused time on the current plan (upgrades only). */
  credit: number;
  subtotal: number;
  tax: number;
  total: number;
  periodStart: string;
  periodEnd: string;
};

export function quoteChange(
  current: SubscriptionSnapshot | null,
  planId: PlanId,
  cycle: BillingCycle,
  now: Date
): Quote {
  const kind = classifyChange(current, planId, cycle);
  const price = planPrice(planId, cycle);

  let credit = 0;
  if (kind === "upgrade" && current) {
    const start = Date.parse(current.currentPeriodStart);
    const end = Date.parse(current.currentPeriodEnd);
    const length = end - start;
    const remaining = Math.min(Math.max(end - now.getTime(), 0), length);
    if (length > 0) {
      credit = Math.round(
        (planPrice(current.planId, current.cycle) * remaining) / length
      );
    }
  }

  const subtotal = Math.max(0, price - credit);
  const tax = Math.round(subtotal * TAX_RATE);

  return {
    kind,
    planId,
    cycle,
    price,
    credit,
    subtotal,
    tax,
    total: subtotal + tax,
    periodStart: now.toISOString(),
    periodEnd: addCycle(now, cycle).toISOString(),
  };
}

/** Renewal charge: full price of the plan for the next period, no proration. */
export function quoteRenewal(
  planId: PlanId,
  cycle: BillingCycle,
  periodStart: Date
): Quote {
  const price = planPrice(planId, cycle);
  const tax = Math.round(price * TAX_RATE);
  return {
    kind: "same",
    planId,
    cycle,
    price,
    credit: 0,
    subtotal: price,
    tax,
    total: price + tax,
    periodStart: periodStart.toISOString(),
    periodEnd: addCycle(periodStart, cycle).toISOString(),
  };
}

/* ---------- Shapes returned by the mock gateway ---------- */

export type CardBrand = "visa" | "mastercard" | "amex" | "jcb" | "unknown";

export type PaymentMethod = {
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
};

export type Subscription = {
  id: string;
  planId: PlanId;
  cycle: BillingCycle;
  status: "active";
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
};

export type InvoiceLine = { description: string; amount: number };

export type Invoice = {
  id: string;
  number: string;
  createdAt: string;
  reason: "subscription_create" | "subscription_update" | "subscription_cycle";
  lines: InvoiceLine[];
  subtotal: number;
  tax: number;
  total: number;
  status: "paid" | "pending" | "expired";
  /** Card used (simulator mode). */
  paymentMethod?: { brand: CardBrand; last4: string };
  /** Xendit mode: channel that paid it (e.g. "BCA", "QRIS") and hosted payment link. */
  channel?: string | null;
  payUrl?: string | null;
};

export type WebhookEventType =
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payment_intent.requires_action"
  | "invoice.created"
  | "invoice.paid"
  | "invoice.expired"
  | "xendit.invoice.callback"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted";

export type WebhookEvent = {
  id: string;
  type: WebhookEventType;
  created: string;
  data: Record<string, unknown>;
};

export type PaymentErrorCode =
  | "invalid_request"
  | "invalid_change"
  | "invalid_number"
  | "invalid_expiry"
  | "expired_card"
  | "invalid_cvc"
  | "card_declined"
  | "insufficient_funds"
  | "authentication_failed";

export type CheckoutResponse =
  | {
      status: "succeeded";
      subscription: Subscription;
      invoice: Invoice;
      paymentMethod: PaymentMethod;
      events: WebhookEvent[];
    }
  | { status: "requires_action"; action: "otp"; events: WebhookEvent[] }
  | { status: "failed"; code: PaymentErrorCode; events: WebhookEvent[] };

export type RenewResponse =
  | {
      status: "succeeded";
      subscription: Subscription;
      invoice: Invoice;
      events: WebhookEvent[];
    }
  | { status: "failed"; code: PaymentErrorCode; events: WebhookEvent[] };

/** Xendit mode: server-side state for the current visitor. */
export type XenditDemoState = {
  /** Auth-demo account the subscription belongs to; null = anonymous browser. */
  account: { name: string; email: string } | null;
  subscription: Subscription | null;
  scheduledChange: { planId: PlanId; cycle: BillingCycle } | null;
  paymentChannel: string | null;
  invoices: Invoice[];
  events: WebhookEvent[];
};
