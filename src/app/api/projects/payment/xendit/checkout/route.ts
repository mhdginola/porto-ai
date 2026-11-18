import { z } from "zod";
import { getCustomerId } from "@/lib/payment-demo/customer";
import {
  errorResponse,
  requestOrigin,
  xenditDisabledResponse,
} from "@/lib/payment-demo/route-helpers";
import { startCheckout } from "@/lib/payment-demo/xendit-service";
import { POLICIES, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  planId: z.enum(["pro", "business"]),
  cycle: z.enum(["monthly", "yearly"]),
  rail: z.enum(["xendit", "crypto"]).optional(),
});

/**
 * Creates an invoice for a new plan or an upgrade. Xendit rail → hosted payment
 * URL; crypto rail → EIP-712 signed quote for the wallet to pay on-chain.
 */
export async function POST(req: Request) {
  const limited = await rateLimit(req, POLICIES.xenditInvoice);
  if (limited) return limited;
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
      requestOrigin(req),
      parsed.data.rail
    );
    return Response.json(result);
  } catch (err) {
    return errorResponse(err, "checkout");
  }
}
