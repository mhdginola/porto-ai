import { createHash } from "node:crypto";
import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";

const LIMITS = {
  perIp10Min: 3,
  perIpDay: 10,
  perEmailDay: 5,
};

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

/** Salted hash so raw IPs are never stored. */
export function hashIp(ip: string): string {
  const salt =
    process.env.CONTACT_IP_SALT?.trim() || process.env.AUTH_DEMO_SECRET?.trim() || "porto-contact";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

async function countSince(column: "ip" | "email", value: string, sinceMs: number) {
  const since = new Date(Date.now() - sinceMs);
  const [row] = await db
    .select({ n: count() })
    .from(contactMessages)
    .where(
      and(
        column === "ip" ? eq(contactMessages.ipHash, value) : eq(contactMessages.email, value),
        gt(contactMessages.createdAt, since)
      )
    );
  return row?.n ?? 0;
}

export async function isRateLimited(ipHash: string, email: string): Promise<boolean> {
  const [ip10, ipDay, emailDay] = await Promise.all([
    countSince("ip", ipHash, 10 * 60_000),
    countSince("ip", ipHash, 86_400_000),
    countSince("email", email, 86_400_000),
  ]);
  return (
    ip10 >= LIMITS.perIp10Min || ipDay >= LIMITS.perIpDay || emailDay >= LIMITS.perEmailDay
  );
}
