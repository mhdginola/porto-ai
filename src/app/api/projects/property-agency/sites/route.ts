import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { propertyAgencySites } from "@/lib/db/schema";
import { defaultSiteConfig } from "@/lib/property-agency/defaults";
import {
  createSiteSchema,
  serializeSiteConfig,
} from "@/lib/property-agency/schemas";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: propertyAgencySites.id,
        slug: propertyAgencySites.slug,
        name: propertyAgencySites.name,
        isPublished: propertyAgencySites.isPublished,
        updatedAt: propertyAgencySites.updatedAt,
      })
      .from(propertyAgencySites)
      .orderBy(desc(propertyAgencySites.updatedAt));

    return Response.json({ sites: rows });
  } catch (err) {
    console.error("[property-agency] list failed:", err);
    return Response.json(
      {
        error:
          "Failed to load sites. Run npm run db:push if the table is missing.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createSiteSchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.flatten().fieldErrors.slug?.[0] ??
      parsed.error.flatten().fieldErrors.name?.[0] ??
      "Invalid input";
    return Response.json({ error: msg }, { status: 400 });
  }

  const config = parsed.data.config ?? defaultSiteConfig(parsed.data.name);
  config.hero.title = config.hero.title || parsed.data.name;

  try {
    const [row] = await db
      .insert(propertyAgencySites)
      .values({
        slug: parsed.data.slug,
        name: parsed.data.name,
        config: serializeSiteConfig(config),
      })
      .returning();

    return Response.json({ site: row }, { status: 201 });
  } catch (err) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    ) {
      return Response.json(
        { error: "This website slug is already taken." },
        { status: 409 }
      );
    }
    console.error("[property-agency] create failed:", err);
    return Response.json({ error: "Failed to create site" }, { status: 500 });
  }
}
