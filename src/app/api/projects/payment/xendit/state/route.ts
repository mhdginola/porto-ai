import { getCustomerId } from "@/lib/payment-demo/customer";
import { errorResponse, xenditDisabledResponse } from "@/lib/payment-demo/route-helpers";
import { getXenditDemoState, reconcilePending } from "@/lib/payment-demo/xendit-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?reconcile=1 also pulls the latest status of open invoices from Xendit. */
export async function GET(req: Request) {
  const disabled = xenditDisabledResponse();
  if (disabled) return disabled;
  try {
    const customerId = await getCustomerId();
    if (new URL(req.url).searchParams.get("reconcile") === "1") {
      await reconcilePending(customerId);
    }
    return Response.json(await getXenditDemoState(customerId));
  } catch (err) {
    return errorResponse(err, "state");
  }
}
