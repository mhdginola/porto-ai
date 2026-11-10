import {
  getPlan,
  quoteChange,
  type CheckoutResponse,
  type Invoice,
  type PaymentErrorCode,
  type PaymentMethod,
  type Subscription,
} from "@/lib/payment-demo/billing";
import {
  cvcLength,
  DEMO_OTP,
  detectBrand,
  digitsOnly,
  isExpired,
  luhnValid,
  testCardOutcome,
} from "@/lib/payment-demo/card";
import {
  checkoutSchema,
  delay,
  event,
  invoiceNumber,
  newId,
  replay,
  respond,
} from "@/lib/payment-demo/server";

export const runtime = "nodejs";

/**
 * Mock payment gateway: creates or upgrades a subscription and charges the card.
 * The amount is always computed here from the plan catalog — the client only
 * sends which plan it wants, never a price.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { status: "failed", code: "invalid_request", events: [] },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // OTP submits reuse the original key, so scope the cache by step + code.
  const scope =
    input.otp === undefined ? "checkout" : `checkout:otp:${input.otp}`;
  const cached = replay(scope, input.idempotencyKey);
  if (cached) return cached;

  await delay(700); // feel like a network round-trip to a real gateway

  const now = new Date(input.now);
  const quote = quoteChange(input.current, input.planId, input.cycle, now);
  const plan = getPlan(input.planId);

  const fail = (code: PaymentErrorCode, status = 402) => {
    const res: CheckoutResponse = {
      status: "failed",
      code,
      events:
        status === 402
          ? [
              event(
                "payment_intent.payment_failed",
                { amount: quote.total, currency: "IDR", failure_code: code },
                now
              ),
            ]
          : [],
    };
    return respond(scope, input.idempotencyKey, res, status);
  };

  if (quote.kind !== "new" && quote.kind !== "upgrade") {
    return fail("invalid_change", 400);
  }

  const { card } = input;
  const number = digitsOnly(card.number);
  const brand = detectBrand(number);

  if (!luhnValid(number)) return fail("invalid_number", 422);
  if (card.expMonth < 1 || card.expMonth > 12) {
    return fail("invalid_expiry", 422);
  }
  if (isExpired(card.expMonth, card.expYear, now)) {
    return fail("expired_card", 422);
  }
  if (!new RegExp(`^\\d{${cvcLength(brand)}}$`).test(card.cvc)) {
    return fail("invalid_cvc", 422);
  }

  const outcome = testCardOutcome(number);
  if (outcome === "declined") return fail("card_declined");
  if (outcome === "insufficient") return fail("insufficient_funds");
  if (outcome === "threeDs") {
    if (input.otp === undefined) {
      const res: CheckoutResponse = {
        status: "requires_action",
        action: "otp",
        events: [
          event(
            "payment_intent.requires_action",
            { amount: quote.total, currency: "IDR", next_action: "3ds_otp" },
            now
          ),
        ],
      };
      return respond(scope, input.idempotencyKey, res);
    }
    if (input.otp !== DEMO_OTP) return fail("authentication_failed");
  }

  const paymentMethod: PaymentMethod = {
    brand,
    last4: number.slice(-4),
    expMonth: card.expMonth,
    expYear: card.expYear,
  };

  const subscription: Subscription = {
    id: input.current?.id ?? newId("sub"),
    planId: input.planId,
    cycle: input.cycle,
    status: "active",
    cancelAtPeriodEnd: false,
    currentPeriodStart: quote.periodStart,
    currentPeriodEnd: quote.periodEnd,
  };

  const cycleLabel = input.cycle === "monthly" ? "monthly" : "yearly";
  const lines: Invoice["lines"] = [
    { description: `${plan.name} plan (${cycleLabel})`, amount: quote.price },
  ];
  if (quote.credit > 0 && input.current) {
    lines.push({
      description: `Unused time on ${getPlan(input.current.planId).name} (${input.current.cycle})`,
      amount: -quote.credit,
    });
  }

  const invoice: Invoice = {
    id: newId("in"),
    number: invoiceNumber(now),
    createdAt: now.toISOString(),
    reason:
      quote.kind === "new" ? "subscription_create" : "subscription_update",
    lines,
    subtotal: quote.subtotal,
    tax: quote.tax,
    total: quote.total,
    status: "paid",
    paymentMethod: { brand, last4: paymentMethod.last4 },
  };

  const chargeId = newId("ch");
  const res: CheckoutResponse = {
    status: "succeeded",
    subscription,
    invoice,
    paymentMethod,
    events: [
      event(
        "payment_intent.succeeded",
        {
          charge: chargeId,
          amount: quote.total,
          currency: "IDR",
          payment_method: `${brand} •••• ${paymentMethod.last4}`,
        },
        now
      ),
      event(
        "invoice.paid",
        { invoice: invoice.id, number: invoice.number, total: invoice.total },
        now
      ),
      event(
        quote.kind === "new"
          ? "customer.subscription.created"
          : "customer.subscription.updated",
        {
          subscription: subscription.id,
          plan: subscription.planId,
          cycle: subscription.cycle,
          current_period_end: subscription.currentPeriodEnd,
          ...(input.current && {
            previous: { plan: input.current.planId, cycle: input.current.cycle },
          }),
        },
        now
      ),
    ],
  };
  return respond(scope, input.idempotencyKey, res);
}
