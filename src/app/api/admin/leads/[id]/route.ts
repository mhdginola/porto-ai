import { z } from "zod";
import { setLeadStatus } from "@/lib/admin/leads";
import { requireAdmin } from "@/lib/admin/session";
import { LEAD_STATUSES } from "@/lib/admin/types";

export const runtime = "nodejs";

const schema = z.object({ status: z.enum(LEAD_STATUSES) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = Number((await params).id);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!Number.isInteger(id) || id < 1 || !parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const lead = await setLeadStatus(id, parsed.data.status);
  return lead
    ? Response.json({ lead })
    : Response.json({ error: "Not found" }, { status: 404 });
}
