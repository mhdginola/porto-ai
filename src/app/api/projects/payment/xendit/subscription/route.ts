import { z } from "zod";
import { getBillingCustomer } from "@/lib/payment-demo/customer";
import { errorResponse, xenditDisabledResponse } from "@/lib/payment-demo/route-helpers";
import { getXenditDemoState, updateSubscription } from "@/lib/payment-demo/xendit-service";
import { POLICIES, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("resume") }),
  z.object({ action: z.literal("unschedule") }),
  z.object({
    action: z.literal("schedule"),
    planId: z.enum(["pro", "business"]),
    cycle: z.enum(["monthly", "yearly"]),
  }),
]);

/** Cancel / resume / schedule a downgrade — no money moves, so no Xendit call. */
export async function POST(req: Request) {
  const limited = await rateLimit(req, POLICIES.xenditAction);
  if (limited) return limited;
  const disabled = xenditDisabledResponse();
  if (disabled) return disabled;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ code: "invalid_request" }, { status: 400 });

  try {
    const customer = await getBillingCustomer();
    await updateSubscription(customer.id, parsed.data);
    return Response.json(await getXenditDemoState(customer.id, customer.account));
  } catch (err) {
    return errorResponse(err, "subscription");
  }
}
