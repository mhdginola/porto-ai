import { getCustomerId } from "@/lib/payment-demo/customer";
import {
  errorResponse,
  requestOrigin,
  xenditDisabledResponse,
} from "@/lib/payment-demo/route-helpers";
import { startRenewal } from "@/lib/payment-demo/xendit-service";
import { POLICIES, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Issues the next period's invoice (normally done by a scheduled job). */
export async function POST(req: Request) {
  const limited = await rateLimit(req, POLICIES.xenditInvoice);
  if (limited) return limited;
  const disabled = xenditDisabledResponse();
  if (disabled) return disabled;
  try {
    const customerId = await getCustomerId();
    return Response.json(await startRenewal(customerId, requestOrigin(req)));
  } catch (err) {
    return errorResponse(err, "renew");
  }
}
