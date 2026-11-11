import { cookies } from "next/headers";
import type { AuthDemoRole, AuthDemoSession } from "@/lib/auth-demo/constants";
import {
  authDemoCookieOptions,
  signAuthDemoSession,
} from "@/lib/auth-demo/session";

export function parseAuthDemoRole(role: string): AuthDemoRole | null {
  if (
    role === "superadmin" ||
    role === "admin" ||
    role === "editor" ||
    role === "viewer"
  ) {
    return role;
  }
  return null;
}

export async function establishAuthDemoSession(user: {
  id: number;
  email: string;
  name: string;
  role: string;
  walletAddress?: string | null;
}): Promise<AuthDemoSession> {
  const role = parseAuthDemoRole(user.role);
  if (!role) {
    throw new Error("Invalid user role");
  }

  const session: AuthDemoSession = {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    walletAddress: user.walletAddress ?? null,
  };

  const token = await signAuthDemoSession(session);
  const jar = await cookies();
  jar.set(authDemoCookieOptions(token));

  return session;
}
