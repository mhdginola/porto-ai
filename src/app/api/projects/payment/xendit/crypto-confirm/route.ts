import { z } from "zod";
import { getBillingCustomer } from "@/lib/payment-demo/customer";
import { errorResponse, xenditDisabledResponse } from "@/lib/payment-demo/route-helpers";
import { confirmCryptoInvoice, getXenditDemoState } from "@/lib/payment-demo/xendit-service";
import { POLICIES, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  invoiceId: z.string().min(1).max(64),
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/).optional(),
});

/**
 * Browser calls this after sending its payment transaction (and polls it until
 * confirmed). Settlement is read from the contract; the tx hash is only stored
 * for the explorer link.
 */
export async function POST(req: Request) {
  const limited = await rateLimit(req, POLICIES.xenditAction);
  if (limited) return limited;
  const disabled = xenditDisabledResponse();
  if (disabled) return disabled;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ code: "invalid_request" }, { status: 400 });

  try {
    const customer = await getBillingCustomer();
    const status = await confirmCryptoInvoice(customer.id, parsed.data.invoiceId, parsed.data.txHash);
    return Response.json({
      status,
      state: status === "paid" ? await getXenditDemoState(customer.id, customer.account) : undefined,
    });
  } catch (err) {
    return errorResponse(err, "crypto-confirm");
  }
}
