"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { formatIdr } from "@/lib/format-idr";
import type { TranslationKey } from "@/lib/i18n/translations";
import {
  getPlan,
  type CheckoutResponse,
  type PaymentErrorCode,
  type Quote,
  type SubscriptionSnapshot,
  type WebhookEvent,
} from "@/lib/payment-demo/billing";
import {
  cvcLength,
  detectBrand,
  digitsOnly,
  formatCardNumber,
  formatExpiry,
  isExpired,
  luhnValid,
  parseExpiry,
  TEST_CARDS,
  type TestCardOutcome,
} from "@/lib/payment-demo/card";
import { cn } from "@/lib/utils";
import { BrandMark, formatDay } from "@/components/payment-demo/shared";

type Success = Extract<CheckoutResponse, { status: "succeeded" }>;

type Props = {
  open: boolean;
  quote: Quote | null;
  current: (SubscriptionSnapshot & { id: string }) | null;
  /** ISO time the quote was computed at; sent so the server prices identically. */
  now: string;
  onClose: () => void;
  onEvents: (events: WebhookEvent[]) => void;
  onSuccess: (res: Success) => void;
  onViewBilling: () => void;
};

type FieldErrors = Partial<Record<"number" | "expiry" | "cvc" | "name", string>>;

const OUTCOME_KEY: Record<TestCardOutcome, TranslationKey> = {
  success: "payment.card.success",
  threeDs: "payment.card.threeDs",
  declined: "payment.card.declined",
  insufficient: "payment.card.insufficient",
};

const OUTCOME_DOT: Record<TestCardOutcome, string> = {
  success: "bg-emerald-500",
  threeDs: "bg-blue-500",
  declined: "bg-red-500",
  insufficient: "bg-amber-500",
};

const FIELD_FOR_CODE: Partial<Record<PaymentErrorCode, keyof FieldErrors>> = {
  invalid_number: "number",
  invalid_expiry: "expiry",
  expired_card: "expiry",
  invalid_cvc: "cvc",
};

export function CheckoutModal(props: Props) {
  // Remount per checkout so form state never leaks between plans.
  if (!props.open || !props.quote) return null;
  return <CheckoutModalInner key={props.now} {...props} quote={props.quote} />;
}

function CheckoutModalInner({
  quote,
  current,
  now,
  onClose,
  onEvents,
  onSuccess,
  onViewBilling,
}: Props & { quote: Quote }) {
  const { t, locale } = useLocale();
  const loc = locale === "id" ? "id" : "en";

  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"form" | "otp" | "done">("form");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [result, setResult] = useState<Success | null>(null);

  const plan = getPlan(quote.planId);
  const brand = detectBrand(number);
  const errorText = (code: PaymentErrorCode) =>
    t(`payment.error.${code}` as TranslationKey);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!luhnValid(number)) next.number = t("payment.error.invalid_number");
    const exp = parseExpiry(expiry);
    if (!exp) next.expiry = t("payment.error.invalid_expiry");
    else if (isExpired(exp.month, exp.year, new Date(now))) {
      next.expiry = t("payment.error.expired_card");
    }
    if (digitsOnly(cvc).length !== cvcLength(brand)) {
      next.cvc = t("payment.error.invalid_cvc");
    }
    if (!name.trim()) next.name = t("payment.error.invalid_name");
    return next;
  }

  async function submit(key: string, otpCode?: string) {
    const exp = parseExpiry(expiry);
    if (!exp) return;
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/projects/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: key,
          planId: quote.planId,
          cycle: quote.cycle,
          current,
          now,
          card: {
            number: digitsOnly(number),
            expMonth: exp.month,
            expYear: exp.year,
            cvc: digitsOnly(cvc),
            name: name.trim(),
          },
          ...(otpCode !== undefined && { otp: otpCode }),
        }),
      });
      const data = (await res.json()) as CheckoutResponse;
      onEvents(data.events ?? []);

      if (data.status === "requires_action") {
        setStep("otp");
      } else if (data.status === "failed") {
        const field = FIELD_FOR_CODE[data.code];
        if (field) {
          setErrors({ [field]: errorText(data.code) });
          setStep("form");
        } else if (data.code === "authentication_failed") {
          setFormError(errorText(data.code));
        } else {
          setFormError(errorText(data.code));
          setStep("form");
        }
      } else {
        setResult(data);
        setStep("done");
        onSuccess(data);
      }
    } catch {
      setFormError(t("payment.error.generic"));
    } finally {
      setBusy(false);
    }
  }

  function onPay(e: React.FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // One key per "Pay" click; the OTP step reuses it for the same payment.
    const key = crypto.randomUUID();
    setIdempotencyKey(key);
    void submit(key);
  }

  function onVerify(e: React.FormEvent) {
    e.preventDefault();
    void submit(idempotencyKey, otp.trim());
  }

  function fillTestCard(n: string) {
    setNumber(formatCardNumber(n));
    const d = new Date(now);
    const yy = String((d.getUTCFullYear() + 3) % 100).padStart(2, "0");
    setExpiry(formatExpiry(`12${yy}`));
    setCvc("123");
    if (!name) setName("Demo User");
    setErrors({});
    setFormError(null);
  }

  const cycleLabel = t(
    quote.cycle === "monthly" ? "payment.cycle.monthly" : "payment.cycle.yearly"
  );

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={t("payment.checkout.title")}
      className="max-h-[92vh] max-w-3xl overflow-y-auto"
    >
      <AnimatePresence mode="wait">
        {step === "done" && result ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-6 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">
              {t("payment.success.title")}
            </h3>
            <p className="mt-1 text-sm text-foreground/60">
              {t("payment.success.desc").replace("{plan}", plan.name)}
            </p>
            <dl className="mt-5 w-full max-w-xs space-y-1.5 rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4 text-left text-sm">
              <Row label={t("payment.col.invoice")} value={result.invoice.number} mono />
              <Row
                label={t("payment.col.amount")}
                value={formatIdr(result.invoice.total, loc)}
              />
              <Row
                label={t("payment.billing.paymentMethod")}
                value={`•••• ${result.paymentMethod.last4}`}
              />
            </dl>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={onClose}>
                OK
              </Button>
              <Button onClick={onViewBilling}>
                {t("payment.success.viewBilling")}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="checkout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-5 md:grid-cols-[1fr_1.15fr]"
          >
            {/* Order summary */}
            <section className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                {t("payment.checkout.summary")}
              </h3>
              <p className="mt-3 text-base font-semibold">
                {plan.name}{" "}
                <span className="font-normal text-foreground/50">· {cycleLabel}</span>
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label={`${plan.name} (${cycleLabel})`} value={formatIdr(quote.price, loc)} />
                {quote.credit > 0 && (
                  <Row
                    label={t("payment.checkout.credit")}
                    value={`− ${formatIdr(quote.credit, loc)}`}
                    valueClass="text-emerald-600 dark:text-emerald-400"
                  />
                )}
                <div className="border-t border-foreground/10 pt-2">
                  <Row label={t("payment.checkout.subtotal")} value={formatIdr(quote.subtotal, loc)} />
                </div>
                <Row label={t("payment.checkout.tax")} value={formatIdr(quote.tax, loc)} />
                <div className="border-t border-foreground/10 pt-2">
                  <Row
                    label={t("payment.checkout.total")}
                    value={formatIdr(quote.total, loc)}
                    bold
                  />
                </div>
              </dl>
              <p className="mt-3 text-xs text-foreground/50">
                {t("payment.checkout.renews").replace(
                  "{date}",
                  formatDay(quote.periodEnd, loc)
                )}
              </p>

              <div className="mt-5 border-t border-foreground/10 pt-4">
                <p className="text-xs font-semibold text-foreground/70">
                  {t("payment.checkout.testCards")}
                </p>
                <p className="mt-0.5 text-[11px] text-foreground/45">
                  {t("payment.checkout.testCardsHint")}
                </p>
                <ul className="mt-2 space-y-1">
                  {TEST_CARDS.map((c) => (
                    <li key={c.number}>
                      <button
                        type="button"
                        disabled={busy || step !== "form"}
                        onClick={() => fillTestCard(c.number)}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-foreground/5 disabled:opacity-50"
                      >
                        <span className="font-mono tabular-nums">
                          {formatCardNumber(c.number)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-foreground/60">
                          <span className={cn("h-1.5 w-1.5 rounded-full", OUTCOME_DOT[c.outcome])} />
                          {t(OUTCOME_KEY[c.outcome])}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Payment */}
            {step === "otp" ? (
              <form onSubmit={onVerify} className="flex flex-col">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  {t("payment.otp.title")}
                </div>
                <p className="mt-2 text-sm text-foreground/60">{t("payment.otp.desc")}</p>
                <FormField
                  id="pay-otp"
                  label={t("payment.otp.label")}
                  className="mt-4"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(digitsOnly(e.target.value))}
                  autoFocus
                />
                {formError && <FormError text={formError} />}
                <div className="mt-auto flex gap-2 pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      setStep("form");
                      setOtp("");
                      setFormError(null);
                    }}
                  >
                    {t("payment.otp.back")}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={busy || otp.length !== 6}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {busy ? t("payment.checkout.processing") : t("payment.otp.verify")}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={onPay} noValidate className="space-y-3">
                <div className="relative">
                  <FormField
                    id="pay-number"
                    label={t("payment.checkout.cardNumber")}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    value={number}
                    error={errors.number}
                    onChange={(e) => setNumber(formatCardNumber(e.target.value))}
                    className="[&_input]:pr-16 [&_input]:font-mono"
                  />
                  <span className="pointer-events-none absolute right-2.5 top-[29px]">
                    <BrandMark brand={brand} />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    id="pay-expiry"
                    label={t("payment.checkout.expiry")}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="12 / 29"
                    value={expiry}
                    error={errors.expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    className="[&_input]:font-mono"
                  />
                  <FormField
                    id="pay-cvc"
                    label={t("payment.checkout.cvc")}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder={brand === "amex" ? "1234" : "123"}
                    maxLength={cvcLength(brand)}
                    value={cvc}
                    error={errors.cvc}
                    onChange={(e) => setCvc(digitsOnly(e.target.value))}
                    className="[&_input]:font-mono"
                  />
                </div>
                <FormField
                  id="pay-name"
                  label={t("payment.checkout.name")}
                  autoComplete="cc-name"
                  placeholder="Demo User"
                  value={name}
                  error={errors.name}
                  onChange={(e) => setName(e.target.value)}
                />
                {formError && <FormError text={formError} />}
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  {busy
                    ? t("payment.checkout.processing")
                    : t("payment.checkout.pay").replace(
                        "{amount}",
                        formatIdr(quote.total, loc)
                      )}
                </Button>
                <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-foreground/45">
                  <CreditCard className="mt-0.5 h-3 w-3 shrink-0" />
                  {t("payment.checkout.secure")}
                </p>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
  valueClass,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={cn("text-foreground/60", bold && "font-semibold text-foreground")}>
        {label}
      </dt>
      <dd
        className={cn(
          "tabular-nums",
          bold && "text-base font-semibold",
          mono && "font-mono text-xs",
          valueClass
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function FormError({ text }: { text: string }) {
  return (
    <p
      role="alert"
      className="mt-3 flex items-start gap-1.5 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-2 text-xs text-red-600 dark:text-red-400"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {text}
    </p>
  );
}
