import { cronOrigin, isAuthorizedCron } from "@/lib/cron-auth";
import { runMaintenance } from "@/lib/maintenance";
import { isXenditEnabled } from "@/lib/payment-demo/xendit";
import { runRenewalJob } from "@/lib/payment-demo/xendit-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Single daily cron (vercel.json): demo-data maintenance + subscription
 * renewals. Each job runs even if the other fails.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [maintenance, renewals] = await Promise.allSettled([
    runMaintenance(),
    isXenditEnabled() ? runRenewalJob(cronOrigin()) : Promise.resolve("xendit_disabled"),
  ]);

  const result = {
    maintenance:
      maintenance.status === "fulfilled" ? maintenance.value : { error: String(maintenance.reason) },
    renewals:
      renewals.status === "fulfilled" ? renewals.value : { error: String(renewals.reason) },
  };
  console.info("[cron/daily]", JSON.stringify(result));
  const failed = maintenance.status === "rejected" || renewals.status === "rejected";
  return Response.json(result, { status: failed ? 500 : 200 });
}
