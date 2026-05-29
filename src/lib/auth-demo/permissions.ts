import type { AuthDemoRole } from "@/lib/auth-demo/constants";

export const AUTH_DEMO_MODULE_IDS = [
  "analytics",
  "content",
  "users",
  "settings",
] as const;

export type AuthDemoModuleId = (typeof AUTH_DEMO_MODULE_IDS)[number];

/** Roles whose module access can be configured by superadmin. */
export const MANAGEABLE_ROLES = ["viewer", "editor", "admin"] as const;

export type ManageableRole = (typeof MANAGEABLE_ROLES)[number];

export type PermissionMatrix = Record<
  ManageableRole,
  Record<AuthDemoModuleId, boolean>
>;

export type PermissionRow = {
  role: ManageableRole;
  moduleId: AuthDemoModuleId;
  allowed: boolean;
};

/** Default matrix matching the original hierarchical RBAC demo. */
export const DEFAULT_PERMISSION_MATRIX: PermissionMatrix = {
  viewer: {
    analytics: true,
    content: false,
    users: false,
    settings: false,
  },
  editor: {
    analytics: true,
    content: true,
    users: false,
    settings: false,
  },
  admin: {
    analytics: true,
    content: true,
    users: true,
    settings: true,
  },
};

export function isManageableRole(role: string): role is ManageableRole {
  return MANAGEABLE_ROLES.includes(role as ManageableRole);
}

export function isAuthDemoModuleId(id: string): id is AuthDemoModuleId {
  return AUTH_DEMO_MODULE_IDS.includes(id as AuthDemoModuleId);
}

export function matrixFromRows(rows: PermissionRow[]): PermissionMatrix {
  const matrix = structuredClone(DEFAULT_PERMISSION_MATRIX);
  for (const row of rows) {
    if (isManageableRole(row.role) && isAuthDemoModuleId(row.moduleId)) {
      matrix[row.role][row.moduleId] = row.allowed;
    }
  }
  return matrix;
}

export function matrixToRows(matrix: PermissionMatrix): PermissionRow[] {
  const rows: PermissionRow[] = [];
  for (const role of MANAGEABLE_ROLES) {
    for (const moduleId of AUTH_DEMO_MODULE_IDS) {
      rows.push({
        role,
        moduleId,
        allowed: matrix[role][moduleId],
      });
    }
  }
  return rows;
}

export function hasModuleAccess(
  matrix: PermissionMatrix,
  role: AuthDemoRole,
  moduleId: AuthDemoModuleId
): boolean {
  if (role === "superadmin") return true;
  if (!isManageableRole(role)) return false;
  return matrix[role][moduleId];
}

export function countAllowedModules(
  matrix: PermissionMatrix,
  role: AuthDemoRole
): number {
  return AUTH_DEMO_MODULE_IDS.filter((id) =>
    hasModuleAccess(matrix, role, id)
  ).length;
}
