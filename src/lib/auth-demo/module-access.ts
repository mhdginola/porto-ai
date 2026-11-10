import type { AuthDemoModuleId } from "@/lib/auth-demo/permissions";
import type { Entitlement } from "@/lib/payment-demo/entitlements";
import type { PlanId } from "@/lib/payment-demo/billing";

export type ModuleAccess = {
  id: AuthDemoModuleId;
  allowed: boolean;
  /** Why it's locked: the role matrix, or the subscription plan. */
  reason: "role" | "plan" | null;
  requiredPlan: PlanId;
  /** Module payload — only sent when allowed. */
  data: { stat: string } | null;
};

export type ModulesResponse = {
  plan: Entitlement;
  /** Whether a real billing backend (Xendit) is configured to upgrade with. */
  billingEnabled: boolean;
  modules: ModuleAccess[];
};
