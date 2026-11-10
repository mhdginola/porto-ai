/**
 * Fixed-window rate limiting backed by Postgres, so limits hold across
 * serverless instances. One upsert round-trip per request covers every rule.
 */
import { createHash } from "node:crypto";
import { lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimitHits } from "@/lib/db/schema";

export type Rule = { limit: number; windowSec: number };

export type Policy = {
  /** Shared bucket name — routes using the same bucket share the budget. */
  bucket: string;
  /** Limits per client IP. */
  perIp: Rule[];
  /** Limits across all clients (protects paid quotas from distributed abuse). */
  global?: Rule[];
};

const MIN = 60;
const HOUR = 3600;
const DAY = 86_400;

/** All AI generation endpoints share one budget per visitor. */
export const AI_POLICY: Policy = {
  bucket: "ai",
  perIp: [
    { limit: 15, windowSec: 5 * MIN },
    { limit: 100, windowSec: DAY },
  ],
  global: [{ limit: 3000, windowSec: DAY }],
};

export const POLICIES = {
  ai: AI_POLICY,
  /** Google Places API is billed per call. */
  placesLookup: {
    bucket: "places",
    perIp: [
      { limit: 5, windowSec: 10 * MIN },
      { limit: 20, windowSec: DAY },
    ],
    global: [{ limit: 300, windowSec: DAY }],
  },
  pdfUpload: {
    bucket: "pdf-upload",
    perIp: [
      { limit: 3, windowSec: 10 * MIN },
      { limit: 15, windowSec: DAY },
    ],
    global: [{ limit: 200, windowSec: DAY }],
  },
  login: { bucket: "login", perIp: [{ limit: 10, windowSec: 10 * MIN }] },
  signup: {
    bucket: "signup",
    perIp: [
      { limit: 3, windowSec: HOUR },
      { limit: 10, windowSec: DAY },
    ],
  },
  /** Writes to the shared demo data (CRUD, property sites, permissions). */
  demoWrite: {
    bucket: "demo-write",
    perIp: [
      { limit: 30, windowSec: 5 * MIN },
      { limit: 300, windowSec: DAY },
    ],
  },
  imageUpload: {
    bucket: "image-upload",
    perIp: [
      { limit: 10, windowSec: HOUR },
      { limit: 40, windowSec: DAY },
    ],
  },
  paymentSim: { bucket: "payment-sim", perIp: [{ limit: 30, windowSec: 10 * MIN }] },
  /** Creates real (test-mode) invoices at Xendit. */
  xenditInvoice: {
    bucket: "xendit-invoice",
    perIp: [
      { limit: 10, windowSec: 10 * MIN },
      { limit: 30, windowSec: DAY },
    ],
  },
  xenditAction: { bucket: "xendit-action", perIp: [{ limit: 30, windowSec: 10 * MIN }] },
} satisfies Record<string, Policy>;

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

/** Salted hash so raw IPs are never stored. */
export function hashIp(ip: string): string {
  const salt =
    process.env.CONTACT_IP_SALT?.trim() || process.env.AUTH_DEMO_SECRET?.trim() || "porto-ip";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * Count this request against the policy. Returns a 429 Response when any rule is
 * exceeded, otherwise null. Fails open (allows the request) if the database is
 * unavailable, so an outage doesn't take every endpoint down with it.
 */
export async function rateLimit(req: Request, policy: Policy): Promise<Response | null> {
  const now = Date.now();
  const ip = hashIp(clientIp(req));

  const entries = [
    ...policy.perIp.map((r) => ({ rule: r, id: `ip:${ip}` })),
    ...(policy.global ?? []).map((r) => ({ rule: r, id: "global" })),
  ].map(({ rule, id }) => {
    const windowMs = rule.windowSec * 1000;
    const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
    return {
      rule,
      key: `${policy.bucket}:${id}:${rule.windowSec}`,
      windowStart,
      resetAt: windowStart.getTime() + windowMs,
    };
  });

  let counts: Map<string, number>;
  try {
    const rows = await db
      .insert(rateLimitHits)
      .values(entries.map((e) => ({ key: e.key, windowStart: e.windowStart, count: 1 })))
      .onConflictDoUpdate({
        target: [rateLimitHits.key, rateLimitHits.windowStart],
        set: { count: sql`${rateLimitHits.count} + 1` },
      })
      .returning({ key: rateLimitHits.key, count: rateLimitHits.count });
    counts = new Map(rows.map((r) => [r.key, r.count]));
  } catch (err) {
    console.error(`[rate-limit] ${policy.bucket}: check failed, allowing request:`, err);
    return null;
  }

  const exceeded = entries
    .filter((e) => (counts.get(e.key) ?? 0) > e.rule.limit)
    .sort((a, b) => b.resetAt - a.resetAt)[0];
  if (!exceeded) return null;

  const retryAfter = Math.max(1, Math.ceil((exceeded.resetAt - now) / 1000));
  return Response.json(
    {
      error: "Too many requests. Please try again later.",
      code: "rate_limited",
      retryAfter,
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/** Delete counters from finished windows (run daily). */
export async function pruneRateLimits(olderThanSec = 2 * DAY) {
  const cutoff = new Date(Date.now() - olderThanSec * 1000);
  const deleted = await db
    .delete(rateLimitHits)
    .where(lt(rateLimitHits.windowStart, cutoff))
    .returning({ key: rateLimitHits.key });
  return deleted.length;
}
