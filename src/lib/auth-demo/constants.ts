export const AUTH_DEMO_COOKIE = "porto_auth_demo";
export const AUTH_DEMO_ROLES = [
  "superadmin",
  "admin",
  "editor",
  "viewer",
] as const;
export type AuthDemoRole = (typeof AUTH_DEMO_ROLES)[number];

export type AuthDemoUser = {
  id: number;
  email: string;
  name: string;
  role: AuthDemoRole;
};

export type AuthDemoSession = AuthDemoUser;
