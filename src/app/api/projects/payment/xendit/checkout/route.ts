import { z } from "zod";
import { getCustomerId } from "@/lib/payment-demo/customer";
import {
  errorResponse,
  requestOrigin,
  xenditDisabledResponse,
} from "@/lib/payment-demo/route-helpers";
import { startCheckout } from "@/lib/payment-demo/xendit-service";

export const runtime = "nodejs";

const schema = z.object({
  planId: z.enum(["pro", "business"]),
  cycle: z.enum(["monthly", "yearly"]),
});

/** Creates a Xendit invoice for a new plan or an upgrade; returns its payment URL. */
export async function POST(req: Request) {
  const disabled = xenditDisabledResponse();
  if (disabled) return disabled;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ code: "invalid_request" }, { status: 400 });

  try {
    const customerId = await getCustomerId();
    const result = await startCheckout(
      customerId,
      parsed.data.planId,
      parsed.data.cycle,
      requestOrigin(req)
    );
    return Response.json(result);
  } catch (err) {
    return errorResponse(err, "checkout");
  }
}
