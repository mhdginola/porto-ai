import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  AUTH_DEMO_COOKIE,
  type AuthDemoSession,
} from "@/lib/auth-demo/constants";

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

function getSecret() {
  const secret =
    process.env.AUTH_DEMO_SECRET ?? "porto-auth-demo-dev-only-change-me";
  return new TextEncoder().encode(secret);
}

export async function signAuthDemoSession(
  user: AuthDemoSession
): Promise<string> {
  return new SignJWT({
    sub: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyAuthDemoToken(
  token: string
): Promise<AuthDemoSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = Number(payload.sub);
    const email = payload.email;
    const name = payload.name;
    const role = payload.role;
    if (
      !Number.isFinite(id) ||
      typeof email !== "string" ||
      typeof name !== "string" ||
      (role !== "admin" && role !== "editor" && role !== "viewer")
    ) {
      return null;
    }
    return { id, email, name, role };
  } catch {
    return null;
  }
}

export async function getAuthDemoSession(): Promise<AuthDemoSession | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_DEMO_COOKIE)?.value;
  if (!token) return null;
  return verifyAuthDemoToken(token);
}

export function authDemoCookieOptions(token: string) {
  return {
    name: AUTH_DEMO_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function clearAuthDemoCookieOptions() {
  return {
    name: AUTH_DEMO_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
