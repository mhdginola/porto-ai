import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { establishAuthDemoSession } from "@/lib/auth-demo/establish-session";
import { signupSchema } from "@/lib/auth-demo/schemas";
import { db } from "@/lib/db";
import { demoUsers } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.name?.[0] ??
      parsed.error.flatten().fieldErrors.email?.[0] ??
      parsed.error.flatten().fieldErrors.password?.[0] ??
      "Invalid input";
    return Response.json({ error: msg }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const name = parsed.data.name;

  try {
    const [existing] = await db
      .select({ id: demoUsers.id })
      .from(demoUsers)
      .where(eq(demoUsers.email, email))
      .limit(1);

    if (existing) {
      return Response.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const [user] = await db
      .insert(demoUsers)
      .values({
        email,
        name,
        passwordHash,
        role: "viewer",
      })
      .returning();

    const session = await establishAuthDemoSession(user);
    return Response.json({ user: session }, { status: 201 });
  } catch (err) {
    console.error("[auth-demo] signup failed:", err);
    return Response.json(
      { error: "Sign up failed. Run npm run db:push if the table is missing." },
      { status: 500 }
    );
  }
}
