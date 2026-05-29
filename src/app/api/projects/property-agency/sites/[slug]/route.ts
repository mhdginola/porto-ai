import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { propertyAgencySites } from "@/lib/db/schema";
import {
  parseSiteConfig,
  serializeSiteConfig,
  updateSiteSchema,
} from "@/lib/property-agency/schemas";

export const runtime = "nodejs";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Params) {
  const { slug } = await params;
  const manage = new URL(req.url).searchParams.get("manage") === "1";

  try {
    const [row] = await db
      .select()
      .from(propertyAgencySites)
      .where(eq(propertyAgencySites.slug, slug))
      .limit(1);

    if (!row || (!manage && !row.isPublished)) {
      return Response.json({ error: "Site not found" }, { status: 404 });
    }

    return Response.json({
      site: {
        ...row,
        config: parseSiteConfig(row.config),
      },
    });
  } catch (err) {
    console.error("[property-agency] get failed:", err);
    return Response.json({ error: "Failed to load site" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSiteSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const [existing] = await db
      .select()
      .from(propertyAgencySites)
      .where(eq(propertyAgencySites.slug, slug))
      .limit(1);

    if (!existing) {
      return Response.json({ error: "Site not found" }, { status: 404 });
    }

    const updates: Partial<typeof propertyAgencySites.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.isPublished !== undefined) {
      updates.isPublished = parsed.data.isPublished;
    }
    if (parsed.data.config !== undefined) {
      updates.config = serializeSiteConfig(parsed.data.config);
    }

    const [row] = await db
      .update(propertyAgencySites)
      .set(updates)
      .where(eq(propertyAgencySites.slug, slug))
      .returning();

    return Response.json({
      site: {
        ...row,
        config: parseSiteConfig(row.config),
      },
    });
  } catch (err) {
    console.error("[property-agency] update failed:", err);
    return Response.json({ error: "Failed to update site" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { slug } = await params;

  try {
    const [row] = await db
      .delete(propertyAgencySites)
      .where(eq(propertyAgencySites.slug, slug))
      .returning({ id: propertyAgencySites.id });

    if (!row) {
      return Response.json({ error: "Site not found" }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[property-agency] delete failed:", err);
    return Response.json({ error: "Failed to delete site" }, { status: 500 });
  }
}
