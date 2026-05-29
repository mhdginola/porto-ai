import { z } from "zod";
import { getAuthDemoSession } from "@/lib/auth-demo/session";
import {
  AUTH_DEMO_MODULE_IDS,
  MANAGEABLE_ROLES,
  type PermissionMatrix,
} from "@/lib/auth-demo/permissions";
import {
  loadPermissionMatrix,
  savePermissionMatrix,
} from "@/lib/auth-demo/permission-store";

export const runtime = "nodejs";

const moduleRecordSchema = z.object({
  analytics: z.boolean(),
  content: z.boolean(),
  users: z.boolean(),
  settings: z.boolean(),
});

const updateSchema = z.object({
  matrix: z.object({
    viewer: moduleRecordSchema,
    editor: moduleRecordSchema,
    admin: moduleRecordSchema,
  }),
});

export async function GET() {
  const user = await getAuthDemoSession();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const matrix = await loadPermissionMatrix();
    return Response.json({ matrix, canEdit: user.role === "superadmin" });
  } catch {
    return Response.json(
      {
        error:
          "Failed to load permissions. Run npm run db:push && npm run db:seed-auth.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const user = await getAuthDemoSession();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "superadmin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid permission matrix" }, { status: 400 });
  }

  try {
    await savePermissionMatrix(parsed.data.matrix as PermissionMatrix);
    const matrix = await loadPermissionMatrix();
    return Response.json({ matrix, canEdit: true });
  } catch {
    return Response.json({ error: "Failed to save permissions" }, { status: 500 });
  }
}
