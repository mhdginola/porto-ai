import type { ModuleAccess, ModulesResponse } from "@/lib/auth-demo/module-access";
import { loadPermissionMatrix } from "@/lib/auth-demo/permission-store";
import { AUTH_DEMO_MODULE_IDS, hasModuleAccess } from "@/lib/auth-demo/permissions";
import { getAuthDemoSession } from "@/lib/auth-demo/session";
import { customerIdForUser } from "@/lib/payment-demo/customer";
import { MODULE_MIN_PLAN, planAllows } from "@/lib/payment-demo/entitlements";
import { isXenditEnabled } from "@/lib/payment-demo/xendit";
import { getEntitlement } from "@/lib/payment-demo/xendit-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Demo payloads per module; only returned to users who pass both gates. */
const MODULE_DATA = {
  analytics: { stat: "12.4k" },
  content: { stat: "86" },
  users: { stat: "24" },
  settings: { stat: "—" },
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
    const [matrix, plan] = await Promise.all([
      loadPermissionMatrix(),
      getEntitlement(customerIdForUser(user.id)),
    ]);

    const modules: ModuleAccess[] = AUTH_DEMO_MODULE_IDS.map((id) => {
      const byRole = hasModuleAccess(matrix, user.role, id);
      const byPlan = planAllows(plan.planId, id);
      const allowed = byRole && byPlan;
      return {
        id,
        allowed,
        reason: byRole ? (byPlan ? null : "plan") : "role",
        requiredPlan: MODULE_MIN_PLAN[id],
        data: allowed ? MODULE_DATA[id] : null,
      };
    });

    const body: ModulesResponse = { plan, billingEnabled: isXenditEnabled(), modules };
    return Response.json(body);
  } catch (err) {
    console.error("[auth-demo] module access failed:", err);
    return Response.json(
      { error: "Could not load module access. Run npm run db:push if tables are missing." },
      { status: 500 }
    );
  }
}
