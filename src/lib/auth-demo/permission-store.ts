import { db } from "@/lib/db";
import { demoRolePermissions } from "@/lib/db/schema";
import {
  DEFAULT_PERMISSION_MATRIX,
  type PermissionMatrix,
  type PermissionRow,
  matrixFromRows,
  matrixToRows,
} from "@/lib/auth-demo/permissions";

export async function loadPermissionMatrix(): Promise<PermissionMatrix> {
  const rows = await db.select().from(demoRolePermissions);
  if (rows.length === 0) {
    return structuredClone(DEFAULT_PERMISSION_MATRIX);
  }

  const mapped: PermissionRow[] = rows.map((row) => ({
    role: row.role as PermissionRow["role"],
    moduleId: row.moduleId as PermissionRow["moduleId"],
    allowed: row.allowed,
  }));

  return matrixFromRows(mapped);
}

export async function savePermissionMatrix(matrix: PermissionMatrix) {
  const rows = matrixToRows(matrix);

  for (const row of rows) {
    await db
      .insert(demoRolePermissions)
      .values({
        role: row.role,
        moduleId: row.moduleId,
        allowed: row.allowed,
      })
      .onConflictDoUpdate({
        target: [demoRolePermissions.role, demoRolePermissions.moduleId],
        set: { allowed: row.allowed },
      });
  }
}

export async function seedDefaultPermissions() {
  const rows = matrixToRows(DEFAULT_PERMISSION_MATRIX);
  for (const row of rows) {
    await db
      .insert(demoRolePermissions)
      .values({
        role: row.role,
        moduleId: row.moduleId,
        allowed: row.allowed,
      })
      .onConflictDoNothing();
  }
}
