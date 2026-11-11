import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { establishAuthDemoSession } from "@/lib/auth-demo/establish-session";
import { verifySiweRequest } from "@/lib/auth-demo/siwe";
import { db } from "@/lib/db";
import { demoUsers } from "@/lib/db/schema";
import { POLICIES, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  message: z.string().min(50).max(2000),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/).max(4000),
});

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Verify a SIWE signature, then sign in (creating a viewer account on first use). */
export async function POST(req: Request) {
  const limited = await rateLimit(req, POLICIES.login);
  if (limited) return limited;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", code: "invalid_message" }, { status: 400 });
  }

  const result = await verifySiweRequest(req, {
    message: parsed.data.message,
    signature: parsed.data.signature as `0x${string}`,
  });
  if (!result.ok) {
    return Response.json({ error: "Wallet sign-in failed", code: result.error }, { status: 401 });
  }

  const wallet = result.address.toLowerCase();
  try {
    let [user] = await db.select().from(demoUsers).where(eq(demoUsers.walletAddress, wallet)).limit(1);
    if (!user) {
      // Wallet-only account: the password is random and never revealed.
      const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
      [user] = await db
        .insert(demoUsers)
        .values({
          email: `${wallet}@wallet.demo`,
          name: shortAddress(result.address),
          passwordHash,
          role: "viewer",
          walletAddress: wallet,
        })
        .onConflictDoUpdate({ target: demoUsers.walletAddress, set: { walletAddress: wallet } })
        .returning();
    }
    const session = await establishAuthDemoSession({ ...user, walletAddress: result.address });
    return Response.json({ user: session });
  } catch (err) {
    console.error("[auth-demo] SIWE sign-in failed:", err);
    return Response.json(
      { error: "Sign-in failed. Run npm run db:push if the table is missing." },
      { status: 500 }
    );
  }
}
