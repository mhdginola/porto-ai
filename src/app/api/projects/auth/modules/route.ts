import type {
  ModuleAccess,
  ModulesResponse,
  TokenGateInfo,
} from "@/lib/auth-demo/module-access";
import { loadPermissionMatrix } from "@/lib/auth-demo/permission-store";
import { AUTH_DEMO_MODULE_IDS, hasModuleAccess } from "@/lib/auth-demo/permissions";
import { getAuthDemoSession } from "@/lib/auth-demo/session";
import { customerIdForUser } from "@/lib/payment-demo/customer";
import { MODULE_MIN_PLAN, planAllows } from "@/lib/payment-demo/entitlements";
import { isXenditEnabled } from "@/lib/payment-demo/xendit";
import { getEntitlement } from "@/lib/payment-demo/xendit-service";
import { explorerAddressUrl, TOKEN_GATE } from "@/lib/web3/chain";
import { checkTokenGate } from "@/lib/web3/token-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Demo payloads per module; only returned to users who pass both gates. */
const MODULE_DATA = {
  analytics: { stat: "12.4k" },
  content: { stat: "86" },
  users: { stat: "24" },
  settings: { stat: "—" },
  vault: { stat: "" },
} as const;

/**
 * Module access for the signed-in user, evaluated on the server:
 * allowed = role permits it (RBAC matrix) AND plan includes it (entitlements).
 */
export async function GET() {
  const user = await getAuthDemoSession();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const wallet = user.walletAddress ? (user.walletAddress as `0x${string}`) : null;
    const [matrix, plan, gate] = await Promise.all([
      loadPermissionMatrix(),
      getEntitlement(customerIdForUser(user.id)),
      wallet ? checkTokenGate(wallet) : Promise.resolve(null),
    ]);

    const modules: ModuleAccess[] = AUTH_DEMO_MODULE_IDS.map((id) => {
      const byRole = hasModuleAccess(matrix, user.role, id);
      const byPlan = planAllows(plan.planId, id);
      let reason: ModuleAccess["reason"] = byRole ? (byPlan ? null : "plan") : "role";

      // Token-gated module: on-chain ownership, checked here on the server.
      if (id === "vault" && reason === null) {
        if (!gate) reason = "wallet";
        else if (!gate.ok) reason = "rpc";
        else if (!gate.meets) reason = "token";
      }

      const allowed = reason === null;
      const data =
        allowed && id === "vault" && gate?.ok
          ? { stat: `${Number(gate.balance).toLocaleString("en-US")} ${TOKEN_GATE.symbol}` }
          : allowed
            ? MODULE_DATA[id]
            : null;
      return { id, allowed, reason, requiredPlan: MODULE_MIN_PLAN[id], data };
    });

    const tokenGate: TokenGateInfo = {
      chainName: TOKEN_GATE.chain.name,
      tokenSymbol: TOKEN_GATE.symbol,
      tokenAddress: TOKEN_GATE.tokenAddress,
      minBalance: TOKEN_GATE.minBalance,
      faucetUrl: TOKEN_GATE.faucetUrl,
      tokenUrl: explorerAddressUrl(TOKEN_GATE.tokenAddress),
      wallet,
      walletUrl: wallet ? explorerAddressUrl(wallet) : null,
      balance: gate?.ok ? gate.balance : null,
    };

    const body: ModulesResponse = {
      plan,
      billingEnabled: isXenditEnabled(),
      modules,
      tokenGate,
    };
    return Response.json(body);
  } catch (err) {
    console.error("[auth-demo] module access failed:", err);
    return Response.json(
      { error: "Could not load module access. Run npm run db:push if tables are missing." },
      { status: 500 }
    );
  }
}
