import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { demoItems } from "@/lib/db/schema";

export const runtime = "nodejs";

const itemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(500).optional().default(""),
});

type Params = { id: string };

function parseId(id: string) {
  const n = Number.parseInt(id, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id == null) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const [row] = await db
      .update(demoItems)
      .set({
        title: parsed.data.title,
        description: parsed.data.description ?? "",
        updatedAt: new Date(),
      })
      .where(eq(demoItems.id, id))
      .returning();

    if (!row) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ item: row });
  } catch (err) {
    console.error("[crud-demo] update failed:", err);
    return Response.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<Params> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id == null) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const [row] = await db
      .delete(demoItems)
      .where(eq(demoItems.id, id))
      .returning();

    if (!row) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[crud-demo] delete failed:", err);
    return Response.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
