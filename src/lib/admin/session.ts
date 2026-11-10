/**
 * Owner-only admin session. Deliberately separate from the Auth demo, whose
 * accounts and passwords are public.
 *
 * - Enabled only when ADMIN_PASSWORD is set (≥ 12 chars in production).
 * - The session key is derived from the password, so changing the password
 *   signs everyone out.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "porto_admin";
const SESSION_SECONDS = 60 * 60 * 12;
const MIN_PROD_PASSWORD = 12;

function password(): string | null {
  const pw = process.env.ADMIN_PASSWORD?.trim();
  if (!pw) return null;
  if (process.env.NODE_ENV === "production" && pw.length < MIN_PROD_PASSWORD) return null;
  return pw;
}

export function isAdminEnabled(): boolean {
  return password() !== null;
}

function signingKey(pw: string): Uint8Array {
  const pepper = process.env.AUTH_DEMO_SECRET?.trim() ?? "";
  return new Uint8Array(createHash("sha256").update(`porto-admin:${pw}:${pepper}`).digest());
}

export function checkAdminPassword(candidate: string): boolean {
  const pw = password();
  if (!pw) return false;
  // Compare fixed-length digests so timing doesn't leak the password length.
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(pw).digest();
  return timingSafeEqual(a, b);
}

export async function startAdminSession() {
  const pw = password();
  if (!pw) throw new Error("Admin is not enabled");
  const token = await new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(signingKey(pw));
  const jar = await cookies();
  jar.set({
    name: ADMIN_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function endAdminSession() {
  const jar = await cookies();
  jar.set({ name: ADMIN_COOKIE, value: "", path: "/", maxAge: 0 });
}

export async function isAdmin(): Promise<boolean> {
  const pw = password();
  if (!pw) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, signingKey(pw), { algorithms: ["HS256"] });
    return payload.sub === "admin";
  } catch {
    return false;
  }
}

/** Guard for admin API routes: 404 when disabled, 401 when not signed in. */
export async function requireAdmin(): Promise<Response | null> {
  if (!isAdminEnabled()) return Response.json({ error: "Not found" }, { status: 404 });
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}
