import { endAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";

export async function POST() {
  await endAdminSession();
  return Response.json({ ok: true });
}
