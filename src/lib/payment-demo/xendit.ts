/**
 * Minimal Xendit Invoice API client (REST, no SDK).
 * Docs: https://docs.xendit.co/api-reference/ — Invoices v2.
 */
import { timingSafeEqual } from "node:crypto";

/** Overridable for local mocks/tests; defaults to the real API. */
const BASE_URL = process.env.XENDIT_API_BASE_URL?.trim() || "https://api.xendit.co";

export type XenditInvoiceStatus = "PENDING" | "PAID" | "SETTLED" | "EXPIRED";

/** Fields we rely on from both the API response and the invoice callback. */
export type XenditInvoice = {
  id: string;
  external_id: string;
  status: XenditInvoiceStatus;
  amount: number;
  currency?: string;
  invoice_url?: string;
  expiry_date?: string;
  paid_amount?: number;
  paid_at?: string;
  payment_method?: string;
  payment_channel?: string;
};

export class XenditError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
  }
}

function secretKey(): string | null {
  return process.env.XENDIT_SECRET_KEY?.trim() || null;
}

/**
 * Xendit mode is offered only with a test (development) key, unless live mode is
 * explicitly allowed — this is a public portfolio, it must never take real money
 * by accident.
 */
export function xenditMode(): "off" | "test" | "live" | "blocked" {
  const key = secretKey();
  if (!key) return "off";
  if (key.startsWith("xnd_development_")) return "test";
  return process.env.XENDIT_ALLOW_LIVE === "true" ? "live" : "blocked";
}

export function isXenditEnabled(): boolean {
  const mode = xenditMode();
  return mode === "test" || mode === "live";
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = secretKey();
  if (!key || !isXenditEnabled()) {
    throw new XenditError("Xendit is not configured", 503);
  }
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: "Basic " + Buffer.from(key + ":").toString("base64"),
        "Content-Type": "application/json",
        ...init.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new XenditError(`Could not reach Xendit: ${(err as Error).message}`, 504);
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new XenditError(
      typeof body.message === "string"
        ? body.message
        : `Xendit request failed (${res.status})`,
      res.status,
      typeof body.error_code === "string" ? body.error_code : undefined
    );
  }
  return body as T;
}

export function createXenditInvoice(input: {
  externalId: string;
  amount: number;
  description: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  /** Seconds until the payment link expires. */
  invoiceDuration: number;
}): Promise<XenditInvoice> {
  return call<XenditInvoice>("/v2/invoices", {
    method: "POST",
    body: JSON.stringify({
      external_id: input.externalId,
      amount: input.amount,
      currency: "IDR",
      description: input.description,
      invoice_duration: input.invoiceDuration,
      success_redirect_url: input.successRedirectUrl,
      failure_redirect_url: input.failureRedirectUrl,
    }),
  });
}

export function getXenditInvoice(id: string): Promise<XenditInvoice> {
  return call<XenditInvoice>(`/v2/invoices/${encodeURIComponent(id)}`);
}

export function expireXenditInvoice(id: string): Promise<XenditInvoice> {
  return call<XenditInvoice>(`/invoices/${encodeURIComponent(id)}/expire!`, {
    method: "POST",
  });
}

/**
 * Xendit doesn't sign invoice callbacks; it sends the dashboard's verification
 * token verbatim in `x-callback-token`. Compare in constant time.
 */
export function verifyCallbackToken(header: string | null): boolean {
  const expected = process.env.XENDIT_CALLBACK_TOKEN?.trim();
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
