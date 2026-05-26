import { cookies } from "next/headers";
import { clearAuthDemoCookieOptions } from "@/lib/auth-demo/session";

export const runtime = "nodejs";

export async function POST() {
  const jar = await cookies();
  jar.set(clearAuthDemoCookieOptions());
  return Response.json({ ok: true });
}
