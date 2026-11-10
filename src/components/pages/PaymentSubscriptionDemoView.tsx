"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@teispace/next-themes";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FastForward,
  FileText,
  Info as InfoIcon,
  Loader2,
  Receipt,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Webhook,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { CheckoutModal } from "@/components/payment-demo/CheckoutModal";
import {
  BrandMark,
  formatDateTime,
  formatDay,
} from "@/components/payment-demo/shared";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { confirmDialog } from "@/lib/confirm-dialog";
import { formatIdr } from "@/lib/format-idr";
import type { TranslationKey } from "@/lib/i18n/translations";
import {
  classifyChange,
  getPlan,
  PLANS,
  quoteChange,
  TAX_RATE,
  type BillingCycle,
  type CheckoutResponse,
  type Invoice,
  type PaymentMethod,
  type Plan,
  type PlanId,
  type Quote,
  type RenewResponse,
  type Subscription,
  type WebhookEvent,
  type WebhookEventType,
  type XenditDemoState,
} from "@/lib/payment-demo/billing";
import { cn } from "@/lib/utils";

type Tab = "plans" | "billing" | "events";
type Mode = "simulator" | "xendit";
type Scheduled = { planId: PlanId; cycle: BillingCycle } | null;

type SimState = {
  subscription: Subscription | null;
  paymentMethod: PaymentMethod | null;
  scheduledChange: Scheduled;
  invoices: Invoice[];
  events: WebhookEvent[];
  /** Simulated clock = real clock + offset (moved by "fast-forward"). */
  clockOffsetMs: number;
};

const EMPTY: SimState = {
  subscription: null,
  paymentMethod: null,
  scheduledChange: null,
  invoices: [],
  events: [],
  clockOffsetMs: 0,
};

const STORAGE_KEY = "payment-demo:v1";
const MODE_KEY = "payment-demo:mode";
const MAX_EVENTS = 60;
const XENDIT_API = "/api/projects/payment/xendit";

function loadSimState(): SimState {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<SimState>) };
  } catch {
    return EMPTY;
  }
}

function store(key: string, value: string) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    /* storage unavailable — demo still works for this tab */
  }
}

function localEvent(
  type: WebhookEventType,
  data: Record<string, unknown>,
  at: Date
): WebhookEvent {
  return {
    id: `evt_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    type,
    created: at.toISOString(),
    data,
  };
}

const EVENT_STYLE: Record<string, string> = {
  payment_intent: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  invoice: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  customer: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  xendit: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
};

function eventStyle(type: WebhookEventType) {
  if (type === "payment_intent.payment_failed") {
    return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
  }
  if (type === "customer.subscription.deleted" || type === "invoice.expired") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }
  return EVENT_STYLE[type.split(".")[0]] ?? EVENT_STYLE.customer;
}

async function xenditFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${XENDIT_API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { code?: string };
  if (!res.ok) throw new Error(data.code ?? "server_error");
  return data;
}

export function PaymentSubscriptionDemoView({
  xenditEnabled,
}: {
  xenditEnabled: boolean;
}) {
  const { t, locale } = useLocale();
  const { resolvedTheme } = useTheme();
  const loc = locale === "id" ? "id" : "en";
  const isDark = resolvedTheme === "dark";

  const [mode, setMode] = useState<Mode>("simulator");
  const [sim, setSim] = useState<SimState>(EMPTY);
  const [xs, setXs] = useState<XenditDemoState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("plans");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [checkout, setCheckout] = useState<{ quote: Quote; now: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [returnStatus, setReturnStatus] = useState<"success" | "failed" | null>(null);

  const errorText = useCallback(
    (code: string) => {
      const key = `payment.error.${code}` as TranslationKey;
      const text = t(key);
      return text && text !== key ? text : t("payment.error.generic");
    },
    [t]
  );

  const loadXendit = useCallback(
    async (reconcile: boolean) => {
      try {
        const state = await xenditFetch<XenditDemoState>(
          `/state${reconcile ? "?reconcile=1" : ""}`
        );
        setXs(state);
        setError(null);
        return state;
      } catch (err) {
        setError(errorText((err as Error).message));
        return null;
      }
    },
    [errorText]
  );

  /* ---- mount: restore simulator state, pick mode, handle return from Xendit ---- */
  useEffect(() => {
    const loaded = loadSimState();
    const params = new URLSearchParams(globalThis.location.search);
    let initialMode: Mode = "simulator";
    try {
      if (globalThis.localStorage?.getItem(MODE_KEY) === "xendit") initialMode = "xendit";
    } catch {
      /* ignore */
    }
    if (params.get("mode") === "xendit") initialMode = "xendit";
    if (!xenditEnabled) initialMode = "simulator";

    const back = params.get("checkout");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate client-only state after mount
    setSim(loaded);
    setMode(initialMode);
    if (initialMode === "simulator" && loaded.subscription) setCycle(loaded.subscription.cycle);
    if (initialMode === "xendit" && (back === "success" || back === "failed")) {
      setReturnStatus(back);
      setTab("billing");
    }
    if (params.has("checkout") || params.has("mode")) {
      globalThis.history.replaceState(null, "", globalThis.location.pathname);
    }
    setHydrated(true);
  }, [xenditEnabled]);

  useEffect(() => {
    if (hydrated) store(STORAGE_KEY, JSON.stringify(sim));
  }, [sim, hydrated]);

  // Load Xendit state when entering Xendit mode (reconciling open invoices).
  useEffect(() => {
    if (!hydrated || mode !== "xendit") return;
    store(MODE_KEY, "xendit");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState runs after the fetch resolves
    void loadXendit(true).then((s) => {
      if (s?.subscription) setCycle(s.subscription.cycle);
    });
  }, [hydrated, mode, loadXendit]);

  // While an invoice is open, poll Xendit (via our reconcile endpoint) for its status.
  const hasPending = !!xs?.invoices.some((i) => i.status === "pending");
  useEffect(() => {
    if (mode !== "xendit" || !hasPending) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void loadXendit(true);
    }, 5000);
    return () => clearInterval(id);
  }, [mode, hasPending, loadXendit]);

  /* ---- unified view of the active mode ---- */
  const isX = mode === "xendit";
  const sub = isX ? (xs?.subscription ?? null) : sim.subscription;
  const scheduledChange: Scheduled = isX ? (xs?.scheduledChange ?? null) : sim.scheduledChange;
  const invoices = isX ? (xs?.invoices ?? []) : sim.invoices;
  const events = isX ? (xs?.events ?? []) : sim.events;
  const pendingInvoice = isX ? invoices.find((i) => i.status === "pending") : undefined;
  const ready = hydrated && (!isX || xs !== null);

  const now = useCallback(
    () => new Date(Date.now() + (isX ? 0 : sim.clockOffsetMs)),
    [isX, sim.clockOffsetMs]
  );

  const snapshot = useMemo(
    () =>
      sub
        ? {
            id: sub.id,
            planId: sub.planId,
            cycle: sub.cycle,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
          }
        : null,
    [sub]
  );

  const pushSimEvents = useCallback((evts: WebhookEvent[]) => {
    if (evts.length === 0) return;
    setSim((s) => ({
      ...s,
      events: [...[...evts].reverse(), ...s.events].slice(0, MAX_EVENTS),
    }));
  }, []);

  const onCheckoutSuccess = useCallback(
    (res: Extract<CheckoutResponse, { status: "succeeded" }>) => {
      setSim((s) => ({
        ...s,
        subscription: res.subscription,
        paymentMethod: res.paymentMethod,
        scheduledChange: null,
        invoices: [res.invoice, ...s.invoices],
      }));
    },
    []
  );

  function simUpdate(patch: Partial<SimState>, event?: WebhookEvent) {
    setSim((s) => ({
      ...s,
      ...patch,
      events: event ? [event, ...s.events].slice(0, MAX_EVENTS) : s.events,
    }));
  }

  async function xenditAction(body: Record<string, unknown>) {
    setBusy(String(body.action));
    try {
      setXs(
        await xenditFetch<XenditDemoState>("/subscription", {
          method: "POST",
          body: JSON.stringify(body),
        })
      );
      setError(null);
    } catch (err) {
      setError(errorText((err as Error).message));
    } finally {
      setBusy(null);
    }
  }

  /** Create a Xendit invoice and send the visitor to its hosted payment page. */
  async function xenditPay(path: "/checkout" | "/renew", busyKey: string, body?: object) {
    setBusy(busyKey);
    setError(null);
    try {
      const { invoiceUrl } = await xenditFetch<{ invoiceUrl: string | null }>(path, {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      });
      if (invoiceUrl) {
        globalThis.location.assign(invoiceUrl);
        return; // keep the busy state while navigating away
      }
      await loadXendit(false); // fully covered by credit — applied immediately
    } catch (err) {
      setError(errorText((err as Error).message));
    }
    setBusy(null);
  }

  async function onSelectPlan(plan: Plan) {
    const kind = classifyChange(snapshot, plan.id, cycle);
    if (kind === "same") return;

    if (kind === "new" || kind === "upgrade") {
      if (isX) {
        await xenditPay("/checkout", `checkout:${plan.id}`, { planId: plan.id, cycle });
        return;
      }
      const at = now();
      setCheckout({ quote: quoteChange(snapshot, plan.id, cycle, at), now: at.toISOString() });
      return;
    }

    // Downgrade
    if (!sub) return;
    if (plan.id === "free") {
      await onCancel();
      return;
    }
    const ok = await confirmDialog({
      title: t("payment.downgrade.title").replace("{plan}", plan.name),
      text: t("payment.downgrade.text"),
      confirmText: t("payment.downgrade.confirm"),
      cancelText: t("payment.cancel"),
      isDark,
    });
    if (!ok) return;
    if (isX) {
      await xenditAction({ action: "schedule", planId: plan.id, cycle });
      return;
    }
    simUpdate(
      {
        scheduledChange: { planId: plan.id, cycle },
        subscription: { ...sub, cancelAtPeriodEnd: false },
      },
      localEvent(
        "customer.subscription.updated",
        {
          subscription: sub.id,
          pending_update: { plan: plan.id, cycle, effective_at: sub.currentPeriodEnd },
        },
        now()
      )
    );
  }

  async function onCancel() {
    if (!sub) return;
    const ok = await confirmDialog({
      title: t("payment.billing.cancelTitle"),
      text: t("payment.billing.cancelText"),
      confirmText: t("payment.billing.cancelConfirm"),
      cancelText: t("payment.billing.keep"),
      isDark,
    });
    if (!ok) return;
    if (isX) {
      await xenditAction({ action: "cancel" });
      return;
    }
    simUpdate(
      { scheduledChange: null, subscription: { ...sub, cancelAtPeriodEnd: true } },
      localEvent(
        "customer.subscription.updated",
        { subscription: sub.id, cancel_at_period_end: true, cancel_at: sub.currentPeriodEnd },
        now()
      )
    );
  }

  function onResume() {
    if (!sub) return;
    if (isX) {
      void xenditAction({ action: "resume" });
      return;
    }
    simUpdate(
      { subscription: { ...sub, cancelAtPeriodEnd: false } },
      localEvent(
        "customer.subscription.updated",
        { subscription: sub.id, cancel_at_period_end: false },
        now()
      )
    );
  }

  function onUndoScheduled() {
    if (!sub) return;
    if (isX) {
      void xenditAction({ action: "unschedule" });
      return;
    }
    simUpdate(
      { scheduledChange: null },
      localEvent(
        "customer.subscription.updated",
        { subscription: sub.id, pending_update: null },
        now()
      )
    );
  }

  async function onFastForward() {
    if (!sub) return;
    const periodEnd = new Date(sub.currentPeriodEnd);
    const offset = Math.max(sim.clockOffsetMs, periodEnd.getTime() - Date.now() + 1000);
    setError(null);

    if (sub.cancelAtPeriodEnd) {
      simUpdate(
        { clockOffsetMs: offset, subscription: null, scheduledChange: null },
        localEvent(
          "customer.subscription.deleted",
          { subscription: sub.id, plan: sub.planId, ended_at: sub.currentPeriodEnd },
          periodEnd
        )
      );
      setCycle("monthly");
      return;
    }

    if (!sim.paymentMethod) return;
    setBusy("renew");
    try {
      const res = await fetch("/api/projects/payment/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          subscription: snapshot,
          scheduledChange,
          paymentMethod: { brand: sim.paymentMethod.brand, last4: sim.paymentMethod.last4 },
        }),
      });
      const data = (await res.json()) as RenewResponse;
      if (data.status !== "succeeded") {
        setError(errorText(data.code));
        return;
      }
      setSim((s) => ({
        ...s,
        clockOffsetMs: offset,
        subscription: data.subscription,
        scheduledChange: null,
        invoices: [data.invoice, ...s.invoices],
        events: [...[...data.events].reverse(), ...s.events].slice(0, MAX_EVENTS),
      }));
      setCycle(data.subscription.cycle);
    } catch {
      setError(t("payment.error.generic"));
    } finally {
      setBusy(null);
    }
  }

  async function onReset() {
    const ok = await confirmDialog({
      title: t("payment.resetTitle"),
      text: t("payment.resetText"),
      confirmText: t("payment.resetConfirm"),
      cancelText: t("payment.cancel"),
      isDark,
    });
    if (!ok) return;
    setSim(EMPTY);
    setCycle("monthly");
    setError(null);
    setTab("plans");
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setReturnStatus(null);
    store(MODE_KEY, next);
    if (next === "simulator") setCycle(sim.subscription?.cycle ?? "monthly");
  }

  const tabs: { id: Tab; labelKey: TranslationKey; icon: typeof Receipt; count?: number }[] = [
    { id: "plans", labelKey: "payment.tab.plans", icon: Sparkles },
    { id: "billing", labelKey: "payment.tab.billing", icon: Receipt, count: invoices.length },
    { id: "events", labelKey: "payment.tab.events", icon: Webhook, count: events.length },
  ];

  const currentPlan = getPlan(sub?.planId ?? "free");

  // Return banner: success is confirmed once no invoice is still pending.
  const returnBanner =
    returnStatus === "failed"
      ? { tone: "warn" as const, text: t("payment.xendit.returnFailed") }
      : returnStatus === "success"
        ? pendingInvoice
          ? { tone: "info" as const, text: t("payment.xendit.returnWaiting") }
          : { tone: "ok" as const, text: t("payment.xendit.returnSuccess") }
        : null;

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute right-0 top-48 h-96 w-96 rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px]" />
      </div>

      <Container className="relative py-10 sm:py-14">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-foreground/60 transition-colors hover:text-primary-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("projects.backToProjects")}
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-text">
              <CreditCard className="h-3.5 w-3.5" />
              {t("payment.badge")}
            </p>
            <h1 className="mt-2 bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
              {t("payment.title")}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-foreground/55">{t("payment.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              <Zap className="h-3 w-3" />
              {t("payment.testMode")}
            </span>
            {!isX && (
              <Button size="sm" variant="outline" onClick={onReset}>
                <RotateCcw className="h-3.5 w-3.5" />
                {t("payment.reset")}
              </Button>
            )}
          </div>
        </div>

        {/* Mode switch */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div
            role="radiogroup"
            className="inline-flex rounded-xl border border-foreground/10 bg-foreground/[0.03] p-1 text-sm"
          >
            {(["simulator", "xendit"] as const).map((m) => {
              const disabled = m === "xendit" && !xenditEnabled;
              return (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  disabled={disabled || !hydrated}
                  title={disabled ? t("payment.mode.xenditDisabled") : undefined}
                  onClick={() => switchMode(m)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                    mode === m
                      ? "bg-foreground text-background"
                      : "text-foreground/60 hover:text-foreground"
                  )}
                >
                  {t(m === "simulator" ? "payment.mode.simulator" : "payment.mode.xendit")}
                </button>
              );
            })}
          </div>
          <p className="max-w-xl text-xs text-foreground/50">
            {isX
              ? t("payment.xendit.info")
              : !xenditEnabled
                ? t("payment.mode.xenditDisabled")
                : null}
          </p>
        </div>

        {isX && returnBanner && (
          <Banner tone={returnBanner.tone} onClose={() => setReturnStatus(null)}>
            {returnBanner.text}
          </Banner>
        )}
        {isX && pendingInvoice && (
          <Banner tone="info">
            <span className="flex flex-1 flex-wrap items-center justify-between gap-2">
              <span>
                {t("payment.xendit.pending")
                  .replace("{amount}", formatIdr(pendingInvoice.total, loc))
                  .replace("{number}", pendingInvoice.number)}
              </span>
              <span className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void loadXendit(true)}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t("payment.xendit.checkStatus")}
                </Button>
                {pendingInvoice.payUrl && (
                  <a
                    href={pendingInvoice.payUrl}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    {t("payment.xendit.payNow")}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </span>
            </span>
          </Banner>
        )}
        {error && (
          <Banner tone="error" onClose={() => setError(null)}>
            {error}
          </Banner>
        )}

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-xl border border-foreground/10 bg-background/60 p-1 backdrop-blur-xl">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "text-primary-text" : "text-foreground/55 hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="payment-tab-pill"
                      className="absolute inset-0 rounded-lg bg-primary-soft"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{t(item.labelKey)}</span>
                  {item.count ? (
                    <span className="relative z-10 rounded-full bg-foreground/10 px-1.5 text-[10px] tabular-nums">
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {hydrated && !isX && sim.clockOffsetMs > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-foreground/50">
              <Clock className="h-3.5 w-3.5" />
              {t("payment.simulatedDate")}:{" "}
              <span className="font-medium text-foreground/80">
                {formatDay(now().toISOString(), loc)}
              </span>
            </span>
          )}
        </div>

        <div className="mt-5">
          <AnimatePresence mode="wait">
            {tab === "plans" && (
              <motion.div
                key="plans"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-foreground/[0.03] p-1 text-sm">
                    {(["monthly", "yearly"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCycle(c)}
                        className={cn(
                          "rounded-full px-4 py-1.5 font-medium transition-colors",
                          cycle === c
                            ? "bg-foreground text-background"
                            : "text-foreground/60 hover:text-foreground"
                        )}
                      >
                        {t(c === "monthly" ? "payment.cycle.monthly" : "payment.cycle.yearly")}
                        {c === "yearly" && (
                          <span
                            className={cn(
                              "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                              cycle === c
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary-soft text-primary-text"
                            )}
                          >
                            {t("payment.cycle.save")}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {PLANS.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      cycle={cycle}
                      loc={loc}
                      t={t}
                      kind={ready ? classifyChange(snapshot, plan.id, cycle) : "same"}
                      isCurrentTier={currentPlan.id === plan.id}
                      isHigherTier={plan.rank > currentPlan.rank}
                      canceling={!!sub?.cancelAtPeriodEnd}
                      scheduled={
                        scheduledChange?.planId === plan.id && scheduledChange.cycle === cycle
                      }
                      disabled={!ready || busy !== null}
                      loading={busy === `checkout:${plan.id}`}
                      loadingLabel={t("payment.xendit.redirecting")}
                      onSelect={() => void onSelectPlan(plan)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {tab === "billing" && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <section className="rounded-2xl border border-foreground/10 bg-background/60 p-5 backdrop-blur-xl">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                        {t("payment.billing.current")}
                      </p>
                      <p className="mt-1.5 flex items-center gap-2 text-2xl font-bold tracking-tight">
                        {currentPlan.name}
                        <StatusBadge sub={sub} t={t} />
                      </p>
                      {sub && (
                        <p className="mt-1 text-sm text-foreground/55">
                          {formatIdr(currentPlan.price[sub.cycle], loc)}{" "}
                          {t(sub.cycle === "monthly" ? "payment.perMonth" : "payment.perYear")} ·{" "}
                          {t("payment.exclTax")}
                        </p>
                      )}
                    </div>
                    {sub && (
                      <div className="flex flex-wrap gap-2">
                        {sub.cancelAtPeriodEnd ? (
                          <Button size="sm" onClick={onResume} disabled={busy !== null}>
                            {t("payment.billing.resume")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void onCancel()}
                            disabled={busy !== null}
                          >
                            {t("payment.billing.cancel")}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {sub ? (
                    <>
                      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                        <Info label={t("payment.billing.period")}>
                          {formatDay(sub.currentPeriodStart, loc)} –{" "}
                          {formatDay(sub.currentPeriodEnd, loc)}
                        </Info>
                        <Info
                          label={t(
                            sub.cancelAtPeriodEnd
                              ? "payment.billing.endsOn"
                              : "payment.billing.nextCharge"
                          )}
                        >
                          {sub.cancelAtPeriodEnd
                            ? formatDay(sub.currentPeriodEnd, loc)
                            : `${formatIdr(nextChargeTotal(sub, scheduledChange), loc)} · ${formatDay(sub.currentPeriodEnd, loc)}`}
                        </Info>
                        <Info label={t("payment.billing.paymentMethod")}>
                          {isX ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white">
                                XENDIT
                              </span>
                              {xs?.paymentChannel ?? t("payment.xendit.viaXendit")}
                            </span>
                          ) : sim.paymentMethod ? (
                            <span className="inline-flex items-center gap-2">
                              <BrandMark brand={sim.paymentMethod.brand} />
                              <span className="font-mono">•••• {sim.paymentMethod.last4}</span>
                              <span className="text-xs text-foreground/45">
                                {t("payment.billing.expires")}{" "}
                                {String(sim.paymentMethod.expMonth).padStart(2, "0")}/
                                {String(sim.paymentMethod.expYear).slice(-2)}
                              </span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </Info>
                      </dl>

                      {scheduledChange && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2.5 text-sm text-blue-700 dark:text-blue-300">
                          <span className="inline-flex items-center gap-2">
                            <CalendarClock className="h-4 w-4" />
                            {t("payment.billing.scheduled")
                              .replace(
                                "{plan}",
                                `${getPlan(scheduledChange.planId).name} (${t(
                                  scheduledChange.cycle === "monthly"
                                    ? "payment.cycle.monthly"
                                    : "payment.cycle.yearly"
                                )})`
                              )
                              .replace("{date}", formatDay(sub.currentPeriodEnd, loc))}
                          </span>
                          <button
                            type="button"
                            onClick={onUndoScheduled}
                            disabled={busy !== null}
                            className="text-xs font-semibold underline-offset-2 hover:underline"
                          >
                            {t("payment.billing.undo")}
                          </button>
                        </div>
                      )}

                      {isX ? (
                        !sub.cancelAtPeriodEnd && (
                          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-4">
                            <Button
                              size="sm"
                              variant="neutral"
                              onClick={() => void xenditPay("/renew", "xrenew")}
                              disabled={busy !== null}
                            >
                              {busy === "xrenew" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <FileText className="h-3.5 w-3.5" />
                              )}
                              {busy === "xrenew"
                                ? t("payment.xendit.redirecting")
                                : t("payment.xendit.renew")}
                            </Button>
                            <p className="text-xs text-foreground/45">
                              {t("payment.xendit.renewHint")}
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-foreground/10 pt-4">
                          <Button
                            size="sm"
                            variant="neutral"
                            onClick={() => void onFastForward()}
                            disabled={busy !== null}
                          >
                            {busy === "renew" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <FastForward className="h-3.5 w-3.5" />
                            )}
                            {t("payment.billing.fastForward")}
                          </Button>
                          <p className="text-xs text-foreground/45">
                            {t("payment.billing.fastForwardHint")}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-foreground/15 p-4 text-sm text-foreground/60">
                      {t("payment.billing.freeHint")}
                      <Button size="sm" onClick={() => setTab("plans")}>
                        {t("payment.tab.plans")}
                      </Button>
                    </div>
                  )}
                </section>

                <InvoiceTable invoices={invoices} loc={loc} t={t} />
              </motion.div>
            )}

            {tab === "events" && (
              <motion.section
                key="events"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-foreground/10 bg-background/60 backdrop-blur-xl"
              >
                <div className="border-b border-foreground/10 px-5 py-3.5">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Webhook className="h-4 w-4 text-foreground/50" />
                    {t("payment.events.title")}
                  </h2>
                  <p className="mt-1 text-xs text-foreground/50">{t("payment.events.hint")}</p>
                </div>
                {events.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-foreground/50">
                    {t("payment.events.empty")}
                  </p>
                ) : (
                  <ul className="divide-y divide-foreground/5">
                    {events.map((ev) => (
                      <li key={ev.id}>
                        <details className="group px-5 py-3">
                          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1">
                            <span
                              className={cn(
                                "rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium",
                                eventStyle(ev.type)
                              )}
                            >
                              {ev.type}
                            </span>
                            <span className="font-mono text-[11px] text-foreground/40">{ev.id}</span>
                            <span className="ml-auto text-xs tabular-nums text-foreground/50">
                              {formatDateTime(ev.created, loc)}
                            </span>
                          </summary>
                          <pre className="mt-2 overflow-x-auto rounded-lg bg-foreground/[0.04] p-3 font-mono text-[11px] leading-relaxed text-foreground/75">
                            {JSON.stringify(
                              { id: ev.id, type: ev.type, created: ev.created, data: ev.data },
                              null,
                              2
                            )}
                          </pre>
                        </details>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </Container>

      <CheckoutModal
        open={checkout !== null}
        quote={checkout?.quote ?? null}
        now={checkout?.now ?? ""}
        current={snapshot}
        onClose={() => setCheckout(null)}
        onEvents={pushSimEvents}
        onSuccess={onCheckoutSuccess}
        onViewBilling={() => {
          setCheckout(null);
          setTab("billing");
        }}
      />
    </div>
  );
}

function nextChargeTotal(sub: Subscription, scheduled: Scheduled): number {
  const target = scheduled ?? { planId: sub.planId, cycle: sub.cycle };
  const price = getPlan(target.planId).price[target.cycle];
  return price + Math.round(price * TAX_RATE);
}

const BANNER_STYLE = {
  ok: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  error: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
} as const;

function Banner({
  tone,
  children,
  onClose,
}: {
  tone: keyof typeof BANNER_STYLE;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  const Icon = tone === "ok" ? CheckCircle2 : tone === "info" ? InfoIcon : AlertCircle;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "mt-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm",
        BANNER_STYLE[tone]
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div className="flex min-w-0 flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 text-xs opacity-60 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}

const INVOICE_STATUS: Record<Invoice["status"], { cls: string; key: TranslationKey }> = {
  paid: {
    cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    key: "payment.invoice.paid",
  },
  pending: {
    cls: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    key: "payment.invoice.pending",
  },
  expired: {
    cls: "border-foreground/15 bg-foreground/5 text-foreground/50",
    key: "payment.invoice.expired",
  },
};

function InvoiceTable({
  invoices,
  loc,
  t,
}: {
  invoices: Invoice[];
  loc: "en" | "id";
  t: (key: TranslationKey) => string;
}) {
  return (
    <section className="rounded-2xl border border-foreground/10 bg-background/60 backdrop-blur-xl">
      <h2 className="flex items-center gap-2 border-b border-foreground/10 px-5 py-3.5 text-sm font-semibold">
        <Receipt className="h-4 w-4 text-foreground/50" />
        {t("payment.billing.invoices")}
      </h2>
      {invoices.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-foreground/50">
          {t("payment.billing.noInvoices")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-foreground/50">
                <th className="px-5 py-2.5 font-medium">{t("payment.col.invoice")}</th>
                <th className="px-3 py-2.5 font-medium">{t("payment.col.date")}</th>
                <th className="px-3 py-2.5 font-medium">{t("payment.col.description")}</th>
                <th className="px-3 py-2.5 text-right font-medium">{t("payment.col.amount")}</th>
                <th className="px-5 py-2.5 text-right font-medium">{t("payment.col.status")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const status = INVOICE_STATUS[inv.status];
                return (
                  <tr
                    key={inv.id}
                    className={cn(
                      "border-t border-foreground/5 align-top",
                      inv.status === "expired" && "opacity-60"
                    )}
                  >
                    <td className="px-5 py-3 font-mono text-xs">{inv.number}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-foreground/70">
                      {formatDay(inv.createdAt, loc)}
                    </td>
                    <td className="px-3 py-3">
                      <ul className="space-y-0.5">
                        {inv.lines.map((line) => (
                          <li key={line.description} className="flex justify-between gap-4">
                            <span className={cn(line.amount < 0 && "text-foreground/55")}>
                              {line.description}
                            </span>
                            <span className="tabular-nums text-foreground/55">
                              {formatIdr(line.amount, loc)}
                            </span>
                          </li>
                        ))}
                        <li className="flex justify-between gap-4 text-foreground/55">
                          <span>{t("payment.invoice.tax")} 11%</span>
                          <span className="tabular-nums">{formatIdr(inv.tax, loc)}</span>
                        </li>
                      </ul>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums">
                      {formatIdr(inv.total, loc)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          status.cls
                        )}
                      >
                        {inv.status === "paid" && <Check className="h-3 w-3" />}
                        {t(status.key)}
                      </span>
                      {inv.status === "paid" && inv.channel && (
                        <p className="mt-1 text-[11px] text-foreground/45">
                          {t("payment.xendit.paidVia").replace("{channel}", inv.channel)}
                        </p>
                      )}
                      {inv.status === "pending" && inv.payUrl && (
                        <a
                          href={inv.payUrl}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-text hover:underline"
                        >
                          {t("payment.xendit.payNow")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PlanCard({
  plan,
  cycle,
  loc,
  t,
  kind,
  isCurrentTier,
  isHigherTier,
  canceling,
  scheduled,
  disabled,
  loading,
  loadingLabel,
  onSelect,
}: {
  plan: Plan;
  cycle: BillingCycle;
  loc: "en" | "id";
  t: (key: TranslationKey) => string;
  kind: ReturnType<typeof classifyChange>;
  isCurrentTier: boolean;
  /** Target tier is above the current one (a yearly → monthly switch can still be scheduled). */
  isHigherTier: boolean;
  canceling: boolean;
  scheduled: boolean;
  disabled: boolean;
  loading: boolean;
  loadingLabel: string;
  onSelect: () => void;
}) {
  const price = plan.price[cycle];
  const isCurrent = kind === "same";

  let label: string;
  if (scheduled) label = t("payment.plan.scheduled");
  else if (isCurrent) label = canceling ? t("payment.plan.endsSoon") : t("payment.plan.current");
  else if (kind === "new") label = t("payment.plan.choose");
  else if (kind === "upgrade") label = t("payment.plan.upgrade");
  else if (isHigherTier) label = t("payment.plan.switchAtRenewal");
  else label = t("payment.plan.downgrade");

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-background/60 p-5 backdrop-blur-xl transition-shadow",
        plan.popular
          ? "border-primary/40 shadow-[0_14px_40px_-12px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
          : "border-foreground/10",
        isCurrent && "ring-2 ring-primary/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        {plan.popular && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
            {t("payment.plan.popular")}
          </span>
        )}
        {!plan.popular && isCurrentTier && (
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/60">
            {t("payment.plan.current")}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-foreground/55">{plan.tagline[loc]}</p>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight tabular-nums">
          {formatIdr(price, loc)}
        </span>
        <span className="text-sm text-foreground/50">
          {t(cycle === "monthly" ? "payment.perMonth" : "payment.perYear")}
        </span>
      </div>
      <p className="mt-0.5 h-4 text-[11px] text-foreground/45">
        {price > 0 &&
          (cycle === "yearly"
            ? `≈ ${formatIdr(Math.round(price / 12), loc)}${t("payment.perMonth")} · ${t("payment.exclTax")}`
            : t("payment.exclTax"))}
      </p>

      <ul className="mt-5 flex-1 space-y-2 text-sm">
        {plan.features[loc].map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-text" />
            <span className="text-foreground/80">{f}</span>
          </li>
        ))}
      </ul>

      <Button
        className="mt-6 w-full"
        variant={kind === "new" || kind === "upgrade" ? "default" : "outline"}
        disabled={disabled || isCurrent || scheduled}
        onClick={onSelect}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? loadingLabel : label}
      </Button>
    </div>
  );
}

function StatusBadge({
  sub,
  t,
}: {
  sub: Subscription | null;
  t: (key: TranslationKey) => string;
}) {
  const [cls, key]: [string, TranslationKey] = !sub
    ? ["border-foreground/15 bg-foreground/5 text-foreground/60", "payment.billing.status.free"]
    : sub.cancelAtPeriodEnd
      ? ["border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400", "payment.billing.status.canceling"]
      : ["border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", "payment.billing.status.active"];
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", cls)}>
      {t(key)}
    </span>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-foreground/50">{label}</dt>
      <dd className="mt-1 font-medium">{children}</dd>
    </div>
  );
}
