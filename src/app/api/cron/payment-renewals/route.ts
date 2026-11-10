import { timingSafeEqual } from "node:crypto";
import { siteConfig } from "@/lib/site";
import { isXenditEnabled } from "@/lib/payment-demo/xendit";
import { runRenewalJob } from "@/lib/payment-demo/xendit-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const header = req.headers.get("authorization");
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Daily subscription billing job. Vercel Cron calls this with
 * `Authorization: Bearer $CRON_SECRET` (see vercel.json).
 */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isXenditEnabled()) {
    return Response.json({ skipped: "xendit_disabled" });
  }

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).replace(/\/$/, "");
  try {
    const result = await runRenewalJob(origin);
    console.info("[payment-demo] renewal job:", result);
    return Response.json(result);
  } catch (err) {
    console.error("[payment-demo] renewal job crashed:", err);
    return Response.json({ error: "Renewal job failed" }, { status: 500 });
  }
}
