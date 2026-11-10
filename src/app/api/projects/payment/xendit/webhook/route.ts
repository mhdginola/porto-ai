import { z } from "zod";
import { handleXenditInvoice } from "@/lib/payment-demo/xendit-service";
import { verifyCallbackToken } from "@/lib/payment-demo/xendit";

export const runtime = "nodejs";

const callbackSchema = z
  .object({
    id: z.string().min(1),
    external_id: z.string().min(1),
    status: z.enum(["PENDING", "PAID", "SETTLED", "EXPIRED"]),
    amount: z.number(),
    paid_amount: z.number().optional(),
    paid_at: z.string().optional(),
    payment_method: z.string().optional(),
    payment_channel: z.string().optional(),
    currency: z.string().optional(),
  })
  .passthrough();

/**
 * Xendit invoice callback. Set this URL in Xendit Dashboard → Settings →
 * Webhooks → Invoices paid: https://<your-domain>/api/projects/payment/xendit/webhook
 */
export async function POST(req: Request) {
  if (!verifyCallbackToken(req.headers.get("x-callback-token"))) {
    return Response.json({ error: "invalid callback token" }, { status: 401 });
  }

  const parsed = callbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid payload" }, { status: 400 });
  }

  try {
    const known = await handleXenditInvoice(parsed.data, "webhook");
    // 200 for unknown invoices too (e.g. other apps on the same Xendit account),
    // so Xendit doesn't keep retrying them.
    return Response.json({ received: true, matched: known });
  } catch (err) {
    console.error("[payment-demo] webhook failed:", err);
    // Non-2xx → Xendit retries later.
    return Response.json({ error: "processing failed" }, { status: 500 });
  }
}
