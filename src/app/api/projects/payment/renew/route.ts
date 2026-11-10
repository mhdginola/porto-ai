import {
  getPlan,
  quoteRenewal,
  type Invoice,
  type RenewResponse,
  type Subscription,
} from "@/lib/payment-demo/billing";
import {
  delay,
  event,
  invoiceNumber,
  newId,
  renewSchema,
  replay,
  respond,
} from "@/lib/payment-demo/server";
import { POLICIES, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Mock gateway billing-cycle job: charges the card on file for the next period.
 * A scheduled downgrade (paid → cheaper paid plan) takes effect here.
 */
export async function POST(req: Request) {
  const limited = await rateLimit(req, POLICIES.paymentSim);
  if (limited) return limited;
  const body = await req.json().catch(() => null);
  const parsed = renewSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { status: "failed", code: "invalid_request", events: [] },
      { status: 400 }
    );
  }
  const { idempotencyKey, subscription: current, scheduledChange, paymentMethod } =
    parsed.data;

  const cached = replay("renew", idempotencyKey);
  if (cached) return cached;

  const target = scheduledChange ?? {
    planId: current.planId,
    cycle: current.cycle,
  };
  if (target.planId === "free" || current.planId === "free") {
    const res: RenewResponse = { status: "failed", code: "invalid_change", events: [] };
    return respond("renew", idempotencyKey, res, 400);
  }

  await delay(500);

  const periodStart = new Date(current.currentPeriodEnd);
  const quote = quoteRenewal(target.planId, target.cycle, periodStart);
  const plan = getPlan(target.planId);

  const subscription: Subscription = {
    id: current.id,
    planId: target.planId,
    cycle: target.cycle,
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodStart: quote.periodStart,
    currentPeriodEnd: quote.periodEnd,
  };

  const invoice: Invoice = {
    id: newId("in"),
    number: invoiceNumber(periodStart),
    createdAt: periodStart.toISOString(),
    reason: "subscription_cycle",
    lines: [
      { description: `${plan.name} plan (${target.cycle})`, amount: quote.price },
    ],
    subtotal: quote.subtotal,
    tax: quote.tax,
    total: quote.total,
    status: "paid",
    paymentMethod,
  };

  const events = [
    event(
      "payment_intent.succeeded",
      {
        charge: newId("ch"),
        amount: quote.total,
        currency: "IDR",
        payment_method: `${paymentMethod.brand} •••• ${paymentMethod.last4}`,
        off_session: true,
      },
      periodStart
    ),
    event(
      "invoice.paid",
      { invoice: invoice.id, number: invoice.number, total: invoice.total },
      periodStart
    ),
    event(
      "customer.subscription.updated",
      {
        subscription: subscription.id,
        plan: subscription.planId,
        cycle: subscription.cycle,
        current_period_end: subscription.currentPeriodEnd,
        ...(scheduledChange && {
          previous: { plan: current.planId, cycle: current.cycle },
        }),
      },
      periodStart
    ),
  ];

  const res: RenewResponse = { status: "succeeded", subscription, invoice, events };
  return respond("renew", idempotencyKey, res);
}
