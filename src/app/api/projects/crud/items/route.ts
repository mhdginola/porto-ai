import { count, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { demoItems } from "@/lib/db/schema";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

const itemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(500).optional().default(""),
});

function parsePagination(url: URL) {
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  return { page, limit, offset: (page - 1) * limit };
}

export async function GET(req: Request) {
  const { page, limit, offset } = parsePagination(new URL(req.url));

  try {
    const [totalRow] = await db.select({ value: count() }).from(demoItems);
    const total = totalRow?.value ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);

    const rows = await db
      .select()
      .from(demoItems)
      .orderBy(desc(demoItems.updatedAt))
      .limit(limit)
      .offset(total === 0 ? 0 : (safePage - 1) * limit);

    return Response.json({
      items: rows,
      page: safePage,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    console.error("[crud-demo] list failed:", err);
    return Response.json(
      { error: "Failed to load items. Run npm run db:push if the table is missing." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
      .insert(demoItems)
      .values({
        title: parsed.data.title,
        description: parsed.data.description ?? "",
      })
      .returning();
    return Response.json({ item: row }, { status: 201 });
  } catch (err) {
    console.error("[crud-demo] create failed:", err);
    return Response.json({ error: "Failed to create item" }, { status: 500 });
  }
}
