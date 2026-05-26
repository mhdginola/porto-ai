import { getAuthDemoSession } from "@/lib/auth-demo/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getAuthDemoSession();
  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }
  return Response.json({ user });
}
