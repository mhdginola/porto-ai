import { randomBytes } from "node:crypto";
import { z } from "zod";
import type {
  WebhookEvent,
  WebhookEventType,
} from "@/lib/payment-demo/billing";

const planId = z.enum(["free", "pro", "business"]);
const cycle = z.enum(["monthly", "yearly"]);
const isoDate = z.string().datetime();

export const snapshotSchema = z.object({
  id: z.string().min(1).max(64),
  planId,
  cycle,
  currentPeriodStart: isoDate,
  currentPeriodEnd: isoDate,
});

/**
 * The demo keeps a simulated clock on the client (so "fast-forward to renewal"
 * works). Accept it only within a sane window around the real time.
 */
const simulatedNow = isoDate.refine((v) => {
  const t = Date.parse(v);
  const real = Date.now();
  return t >= real - 5 * 60_000 && t <= real + 10 * 365 * 86_400_000;
}, "Simulated time out of range");

export const checkoutSchema = z.object({
  idempotencyKey: z.string().min(8).max(64),
  planId,
  cycle,
  current: snapshotSchema.nullable(),
  now: simulatedNow,
  card: z.object({
    number: z.string().max(32),
    expMonth: z.number().int(),
    expYear: z.number().int(),
    cvc: z.string().max(8),
    name: z.string().trim().min(1).max(80),
  }),
  otp: z.string().max(12).optional(),
});

export const renewSchema = z.object({
  idempotencyKey: z.string().min(8).max(64),
  subscription: snapshotSchema,
  scheduledChange: z.object({ planId, cycle }).nullable(),
  paymentMethod: z.object({
    brand: z.enum(["visa", "mastercard", "amex", "jcb", "unknown"]),
    last4: z.string().regex(/^\d{4}$/),
  }),
});

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

export function invoiceNumber(at: Date): string {
  const ym = `${at.getUTCFullYear()}${String(at.getUTCMonth() + 1).padStart(2, "0")}`;
  return `INV-${ym}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

export function event(
  type: WebhookEventType,
  data: Record<string, unknown>,
  at: Date = new Date()
): WebhookEvent {
  return { id: newId("evt"), type, created: at.toISOString(), data };
}

export function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * In-memory idempotency store: a retried request with the same key replays the
 * original response instead of charging twice. Per server instance only — a real
 * gateway would persist this (e.g. Redis/Postgres with a TTL).
 */
const MAX_ENTRIES = 500;
const store = new Map<string, { status: number; body: unknown }>();

export function replay(scope: string, key: string): Response | null {
  const hit = store.get(`${scope}:${key}`);
  if (!hit) return null;
  return Response.json(hit.body, {
    status: hit.status,
    headers: { "Idempotent-Replayed": "true" },
  });
}

export function respond(
  scope: string,
  key: string,
  body: unknown,
  status = 200
): Response {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(`${scope}:${key}`, { status, body });
  return Response.json(body, { status });
}
