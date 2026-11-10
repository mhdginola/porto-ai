import { getCustomerId } from "@/lib/payment-demo/customer";
import {
  errorResponse,
  requestOrigin,
  xenditDisabledResponse,
} from "@/lib/payment-demo/route-helpers";
import { startRenewal } from "@/lib/payment-demo/xendit-service";

export const runtime = "nodejs";

/** Issues the next period's invoice (normally done by a scheduled job). */
export async function POST(req: Request) {
  const disabled = xenditDisabledResponse();
  if (disabled) return disabled;
  try {
    const customerId = await getCustomerId();
    return Response.json(await startRenewal(customerId, requestOrigin(req)));
  } catch (err) {
    return errorResponse(err, "renew");
  }
}
