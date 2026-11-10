import { z } from "zod";
import {
  checkAdminPassword,
  isAdminEnabled,
  startAdminSession,
} from "@/lib/admin/session";
import { POLICIES, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  if (!isAdminEnabled()) return Response.json({ error: "Not found" }, { status: 404 });
  const limited = await rateLimit(req, POLICIES.adminLogin);
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !checkAdminPassword(parsed.data.password)) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }
  await startAdminSession();
  return Response.json({ ok: true });
}
