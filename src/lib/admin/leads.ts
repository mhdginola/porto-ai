import { and, count, desc, eq, gt, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { classifyContactMessage } from "@/lib/contact/classify";
import type { ContactCategory } from "@/lib/contact/schema";
import { db } from "@/lib/db";
import { contactMessages, type ContactMessageRow } from "@/lib/db/schema";
import {
  LEAD_VIEWS,
  type Lead,
  type LeadStats,
  type LeadStatus,
  type LeadView,
} from "@/lib/admin/types";

export const PAGE_SIZE = 20;

export function toLead(row: ContactMessageRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    message: row.message,
    locale: row.locale,
    category: row.category as ContactCategory | null,
    confidence: row.confidence,
    priority: row.priority as Lead["priority"],
    summary: row.summary,
    suggestedReply: row.suggestedReply,
    aiModel: row.aiModel,
    aiError: row.aiError,
    status: row.status as LeadStatus,
    notifiedAt: row.notifiedAt?.toISOString() ?? null,
    autoRepliedAt: row.autoRepliedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Escape LIKE wildcards in user search input. */
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function listLeads(params: {
  view: LeadView;
  category?: string;
  q?: string;
  page: number;
}): Promise<{ items: Lead[]; total: number }> {
  const filters: SQL[] = [inArray(contactMessages.status, [...LEAD_VIEWS[params.view]])];
  if (params.category === "unclassified") {
    filters.push(sql`${contactMessages.category} is null`);
  } else if (params.category) {
    filters.push(eq(contactMessages.category, params.category));
  }
  const q = params.q?.trim();
  if (q) {
    const p = likePattern(q);
    filters.push(
      or(
        ilike(contactMessages.name, p),
        ilike(contactMessages.email, p),
        ilike(contactMessages.company, p),
        ilike(contactMessages.message, p),
        ilike(contactMessages.summary, p)
      )!
    );
  }
  const where = and(...filters);

  const [rows, [{ n }]] = await Promise.all([
    db
      .select()
      .from(contactMessages)
      .where(where)
      // Unread high-priority first, then newest.
      .orderBy(
        sql`case when ${contactMessages.status} = 'new' and ${contactMessages.priority} = 'high' then 0 else 1 end`,
        desc(contactMessages.createdAt)
      )
      .limit(PAGE_SIZE)
      .offset((params.page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(contactMessages).where(where),
  ]);
  return { items: rows.map(toLead), total: n };
}

export async function leadStats(): Promise<LeadStats> {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [[totals], byCategory] = await Promise.all([
    db
      .select({
        unread: sql<number>`count(*) filter (where ${contactMessages.status} = 'new')`.mapWith(Number),
        highPriorityUnread: sql<number>`count(*) filter (where ${contactMessages.status} = 'new' and ${contactMessages.priority} = 'high')`.mapWith(Number),
        spam: sql<number>`count(*) filter (where ${contactMessages.status} = 'spam')`.mapWith(Number),
        total: count(),
      })
      .from(contactMessages),
    db
      .select({ category: contactMessages.category, n: count() })
      .from(contactMessages)
      .where(gt(contactMessages.createdAt, since))
      .groupBy(contactMessages.category),
  ]);
  return {
    ...totals,
    last30Days: Object.fromEntries(
      byCategory.map((r) => [r.category ?? "unclassified", r.n])
    ),
  };
}

export async function setLeadStatus(id: number, status: LeadStatus): Promise<Lead | null> {
  const [row] = await db
    .update(contactMessages)
    .set({ status })
    .where(eq(contactMessages.id, id))
    .returning();
  return row ? toLead(row) : null;
}

/** Re-run AI triage (e.g. when the model was unavailable at submit time). */
export async function reclassifyLead(id: number): Promise<Lead | null> {
  const [row] = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
  if (!row) return null;

  const ai = await classifyContactMessage({
    name: row.name,
    email: row.email,
    company: row.company ?? "",
    message: row.message,
    locale: row.locale === "id" ? "id" : "en",
    website: "",
    elapsedMs: 0,
  });

  const [updated] = await db
    .update(contactMessages)
    .set(
      ai.ok
        ? {
            category: ai.value.category,
            confidence: Math.round(ai.value.confidence * 100),
            priority: ai.value.priority,
            summary: ai.value.summary,
            suggestedReply: ai.value.suggestedReply,
            aiModel: ai.model,
            aiError: null,
          }
        : { aiModel: ai.model, aiError: ai.error }
    )
    .where(eq(contactMessages.id, id))
    .returning();
  return updated ? toLead(updated) : null;
}
