/**
 * Sign-In with Ethereum (EIP-4361).
 *
 * 1. GET nonce → random nonce, also stored in a short-lived signed httpOnly cookie.
 * 2. The wallet signs a SIWE message containing our domain, origin and that nonce.
 * 3. POST verify → message fields are checked against the request (domain,
 *    origin, nonce, time) BEFORE the signature, so a signature obtained on a
 *    phishing site or replayed later is useless. The nonce is single-use,
 *    enforced server-side (a replayed cookie is rejected too).
 */
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { getAddress, verifyMessage } from "viem";
import { baseSepolia } from "viem/chains";
import { generateSiweNonce, parseSiweMessage, validateSiweMessage } from "viem/siwe";
import { authDemoSigningKey } from "@/lib/auth-demo/session";
import { claimOnce } from "@/lib/rate-limit";
import { publicClient } from "@/lib/web3/chain";

const NONCE_COOKIE = "porto_siwe_nonce";
const NONCE_TTL_SECONDS = 5 * 60;
/** Reject messages issued too long ago, even if they carry no expirationTime. */
const MAX_MESSAGE_AGE_MS = 10 * 60_000;

export type SiweError =
  | "invalid_message"
  | "domain_mismatch"
  | "origin_mismatch"
  | "nonce_mismatch"
  | "expired"
  | "invalid_signature";

export async function issueSiweNonce(): Promise<string> {
  const nonce = generateSiweNonce();
  const token = await new SignJWT({ nonce })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${NONCE_TTL_SECONDS}s`)
    .sign(authDemoSigningKey());
  (await cookies()).set({
    name: NONCE_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/api/projects/auth/siwe",
    maxAge: NONCE_TTL_SECONDS,
  });
  return nonce;
}

/** Read and immediately clear the nonce cookie (single use). */
async function consumeNonce(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(NONCE_COOKIE)?.value;
  jar.set({ name: NONCE_COOKIE, value: "", path: "/api/projects/auth/siwe", maxAge: 0 });
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authDemoSigningKey());
    return typeof payload.nonce === "string" ? payload.nonce : null;
  } catch {
    return null;
  }
}

function requestHost(req: Request): string {
  return (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host)
    .split(",")[0]
    .trim();
}

export async function verifySiweRequest(
  req: Request,
  input: { message: string; signature: `0x${string}` }
): Promise<{ ok: true; address: `0x${string}` } | { ok: false; error: SiweError }> {
  const nonce = await consumeNonce();

  let fields: ReturnType<typeof parseSiweMessage>;
  try {
    fields = parseSiweMessage(input.message);
  } catch {
    return { ok: false, error: "invalid_message" };
  }
  if (!fields.address || !fields.domain || !fields.uri || !fields.nonce || fields.version !== "1") {
    return { ok: false, error: "invalid_message" };
  }

  const host = requestHost(req);
  if (fields.domain !== host) return { ok: false, error: "domain_mismatch" };

  // Browsers always send Origin on POST; it must be the page that asked to sign.
  const origin = req.headers.get("origin");
  let uriOrigin: string;
  try {
    uriOrigin = new URL(fields.uri).origin;
  } catch {
    return { ok: false, error: "invalid_message" };
  }
  if (!origin || origin !== uriOrigin || new URL(origin).host !== host) {
    return { ok: false, error: "origin_mismatch" };
  }

  if (!nonce || fields.nonce !== nonce) return { ok: false, error: "nonce_mismatch" };

  const now = new Date();
  const issuedAt = fields.issuedAt?.getTime();
  if (
    !validateSiweMessage({ message: fields, domain: host, nonce, time: now }) ||
    !issuedAt ||
    now.getTime() - issuedAt > MAX_MESSAGE_AGE_MS ||
    issuedAt - now.getTime() > 60_000
  ) {
    return { ok: false, error: "expired" };
  }

  const address = getAddress(fields.address);
  // Regular wallets (EOA): local signature recovery, no RPC needed.
  let valid = await verifyMessage({ address, message: input.message, signature: input.signature }).catch(
    () => false
  );
  // Smart-contract wallets (ERC-1271 / ERC-6492) need an on-chain check.
  if (!valid && fields.chainId === baseSepolia.id) {
    valid = await publicClient
      .verifySiweMessage({ message: input.message, signature: input.signature, domain: host, nonce })
      .catch(() => false);
  }
  if (!valid) return { ok: false, error: "invalid_signature" };

  // Burn the nonce only after a fully valid attempt, so a junk request can't
  // invalidate someone's in-flight sign-in. Throws (→ 500) if the DB is down.
  if (!(await claimOnce(`siwe:${nonce}`))) return { ok: false, error: "nonce_mismatch" };

  return { ok: true, address };
}
