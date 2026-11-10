import { PaymentDemoError } from "@/lib/payment-demo/xendit-service";
import { isXenditEnabled, XenditError } from "@/lib/payment-demo/xendit";

export function xenditDisabledResponse(): Response | null {
  if (isXenditEnabled()) return null;
  return Response.json(
    { code: "xendit_disabled", error: "Set XENDIT_SECRET_KEY (test key) to enable Xendit mode." },
    { status: 503 }
  );
}

export function errorResponse(err: unknown, scope: string): Response {
  if (err instanceof PaymentDemoError) {
    return Response.json({ code: err.code }, { status: err.status });
  }
  if (err instanceof XenditError) {
    console.error(`[payment-demo] ${scope} Xendit error:`, err.status, err.code, err.message);
    return Response.json({ code: "gateway_error", error: err.message }, { status: 502 });
  }
  console.error(`[payment-demo] ${scope} failed:`, err);
  return Response.json(
    {
      code: "server_error",
      error: "Request failed. Run npm run db:push if the payment tables are missing.",
    },
    { status: 500 }
  );
}

/** Public origin for Xendit redirect URLs (respects reverse-proxy headers). */
export function requestOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return new URL(req.url).origin;
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    new URL(req.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}
