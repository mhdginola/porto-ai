import { reclassifyLead } from "@/lib/admin/leads";
import { requireAdmin } from "@/lib/admin/session";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Re-run AI triage for one message. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }
  const lead = await reclassifyLead(id);
  return lead
    ? Response.json({ lead })
    : Response.json({ error: "Not found" }, { status: 404 });
}
