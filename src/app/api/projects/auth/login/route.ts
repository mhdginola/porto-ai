import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { establishAuthDemoSession } from "@/lib/auth-demo/establish-session";
import { loginSchema } from "@/lib/auth-demo/schemas";
import { db } from "@/lib/db";
import { demoUsers } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const [user] = await db
      .select()
      .from(demoUsers)
      .where(eq(demoUsers.email, email))
      .limit(1);

    if (!user) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const session = await establishAuthDemoSession(user);
    return Response.json({ user: session });
  } catch (err) {
    console.error("[auth-demo] login failed:", err);
    return Response.json(
      { error: "Login failed. Run npm run db:push && npm run db:seed-auth." },
      { status: 500 }
    );
  }
}
