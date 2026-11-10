import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";

const LIMITS = {
  perIp10Min: 3,
  perIpDay: 10,
  perEmailDay: 5,
};

export { clientIp, hashIp } from "@/lib/rate-limit";

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
