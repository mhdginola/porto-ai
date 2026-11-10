import { cronOrigin, isAuthorizedCron } from "@/lib/cron-auth";
import { isXenditEnabled } from "@/lib/payment-demo/xendit";
import { runRenewalJob } from "@/lib/payment-demo/xendit-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Subscription renewal job on its own — for manual runs. The scheduled run
 * goes through /api/cron/daily.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isXenditEnabled()) {
    return Response.json({ skipped: "xendit_disabled" });
  }

  try {
    const result = await runRenewalJob(cronOrigin());
    console.info("[payment-demo] renewal job:", result);
    return Response.json(result);
  } catch (err) {
    console.error("[payment-demo] renewal job crashed:", err);
    return Response.json({ error: "Renewal job failed" }, { status: 500 });
  }
}
