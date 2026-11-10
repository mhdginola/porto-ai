import { z } from "zod";
import { leadStats, listLeads, PAGE_SIZE } from "@/lib/admin/leads";
import { requireAdmin } from "@/lib/admin/session";
import { LEAD_VIEWS, type LeadsResponse, type LeadView } from "@/lib/admin/types";
import { CONTACT_CATEGORIES } from "@/lib/contact/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  view: z.enum(Object.keys(LEAD_VIEWS) as [LeadView, ...LeadView[]]).default("inbox"),
  category: z.enum([...CONTACT_CATEGORIES, "unclassified"]).optional(),
  q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const params = Object.fromEntries(
    [...new URL(req.url).searchParams].filter(([, v]) => v !== "")
  );
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return Response.json({ error: "Invalid query" }, { status: 400 });

  try {
    const [list, stats] = await Promise.all([listLeads(parsed.data), leadStats()]);
    const body: LeadsResponse = { ...list, page: parsed.data.page, pageSize: PAGE_SIZE, stats };
    return Response.json(body);
  } catch (err) {
    console.error("[admin] list leads failed:", err);
    return Response.json({ error: "Failed to load leads" }, { status: 500 });
  }
}
