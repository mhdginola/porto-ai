import type { AuthDemoModuleId } from "@/lib/auth-demo/permissions";
import type { Entitlement } from "@/lib/payment-demo/entitlements";
import type { PlanId } from "@/lib/payment-demo/billing";

export type ModuleAccess = {
  id: AuthDemoModuleId;
  allowed: boolean;
  /**
   * Why it's locked: the role matrix, the subscription plan, or (token-gated
   * modules) no wallet session / not enough tokens / chain unreachable.
   */
  reason: "role" | "plan" | "wallet" | "token" | "rpc" | null;
  requiredPlan: PlanId;
  /** Module payload — only sent when allowed. */
  data: { stat: string } | null;
};

export type TokenGateInfo = {
  chainName: string;
  tokenSymbol: string;
  tokenAddress: string;
  minBalance: number;
  faucetUrl: string;
  tokenUrl: string;
  /** Present when signed in with a wallet. */
  wallet: string | null;
  walletUrl: string | null;
  /** Formatted balance, when the chain could be read. */
  balance: string | null;
};

export type ModulesResponse = {
  plan: Entitlement;
  /** Whether a real billing backend (Xendit) is configured to upgrade with. */
  billingEnabled: boolean;
  modules: ModuleAccess[];
  tokenGate: TokenGateInfo;
};
