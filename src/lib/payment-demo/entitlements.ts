/**
 * Plan entitlements — which subscription plan unlocks which Auth-demo module.
 * Orthogonal to RBAC: a module is accessible only if the user's ROLE allows it
 * (permission matrix) AND their PLAN includes it.
 */
import type { AuthDemoModuleId } from "@/lib/auth-demo/permissions";
import { getPlan, type PlanId } from "@/lib/payment-demo/billing";

export const MODULE_MIN_PLAN: Record<AuthDemoModuleId, PlanId> = {
  analytics: "free",
  content: "free",
  users: "pro", // team management
  settings: "business", // SSO & audit log
};

/** Days a subscription keeps its features after an unpaid renewal date. */
export const GRACE_DAYS = 3;
/** Days before period end the renewal job issues the next invoice. */
export const RENEWAL_LEAD_DAYS = 3;

const DAY_MS = 86_400_000;

export function planAllows(plan: PlanId, moduleId: AuthDemoModuleId): boolean {
  return getPlan(plan).rank >= getPlan(MODULE_MIN_PLAN[moduleId]).rank;
}

export type Entitlement = {
  planId: PlanId;
  /** Set when a paid subscription backs the plan. */
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** Renewal date passed without payment; features last until `graceEndsAt`. */
  pastDue: boolean;
  graceEndsAt: string | null;
};

export const FREE_ENTITLEMENT: Entitlement = {
  planId: "free",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  pastDue: false,
  graceEndsAt: null,
};

/** Effective plan for a subscription at `now` — the single source of truth. */
export function entitlementFor(
  sub: {
    planId: PlanId;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: Date;
  } | null,
  now: Date = new Date()
): Entitlement {
  if (!sub || sub.status !== "active") return FREE_ENTITLEMENT;
  const end = sub.currentPeriodEnd.getTime();
  const graceEnd = end + GRACE_DAYS * DAY_MS;
  const t = now.getTime();

  if (sub.cancelAtPeriodEnd && t >= end) return FREE_ENTITLEMENT;
  if (t >= graceEnd) return FREE_ENTITLEMENT;

  const pastDue = !sub.cancelAtPeriodEnd && t >= end;
  return {
    planId: sub.planId,
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    pastDue,
    graceEndsAt: pastDue ? new Date(graceEnd).toISOString() : null,
  };
}

export function daysFromNow(days: number, now: Date = new Date()): Date {
  return new Date(now.getTime() + days * DAY_MS);
}
