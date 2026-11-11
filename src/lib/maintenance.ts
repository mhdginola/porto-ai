/**
 * Daily cleanup of public demo data, so anonymous visitors can't grow the
 * database without bound. Real contact-form leads are kept.
 */
import { and, desc, eq, inArray, lt, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  contactMessages,
  demoItems,
  demoUsers,
  paymentEvents,
  playgroundDocuments,
  paymentInvoices,
  paymentSubscriptions,
} from "@/lib/db/schema";
import { customerIdForUser } from "@/lib/payment-demo/customer";
import { pruneRateLimits } from "@/lib/rate-limit";

/** Seeded accounts (scripts/seed-auth-demo.ts) are never removed. */
const SEEDED_EMAILS = [
  "superadmin@demo.local",
  "admin@demo.local",
  "editor@demo.local",
  "viewer@demo.local",
];
const SIGNUP_RETENTION_DAYS = 7;
const SPAM_RETENTION_DAYS = 30;
const CRUD_KEEP_ITEMS = 100;
/** Mini RAG sessions live only in the browser tab; uploads older than this are orphaned. */
const PLAYGROUND_RETENTION_HOURS = 24;

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

export type MaintenanceResult = {
  rateLimitRows: number;
  spamMessages: number;
  signupUsers: number;
  crudItems: number;
  playgroundChunks: number;
};

export async function runMaintenance(): Promise<MaintenanceResult> {
  const rateLimitRows = await pruneRateLimits();

  const spam = await db
    .delete(contactMessages)
    .where(
      and(
        eq(contactMessages.status, "spam"),
        lt(contactMessages.createdAt, daysAgo(SPAM_RETENTION_DAYS))
      )
    )
    .returning({ id: contactMessages.id });

  const signupUsers = await db.transaction(async (tx) => {
    const users = await tx
      .delete(demoUsers)
      .where(
        and(
          notInArray(demoUsers.email, SEEDED_EMAILS),
          lt(demoUsers.createdAt, daysAgo(SIGNUP_RETENTION_DAYS))
        )
      )
      .returning({ id: demoUsers.id });
    const customers = users.map((u) => customerIdForUser(u.id));
    if (customers.length > 0) {
      await tx.delete(paymentEvents).where(inArray(paymentEvents.customerId, customers));
      await tx.delete(paymentInvoices).where(inArray(paymentInvoices.customerId, customers));
      await tx
        .delete(paymentSubscriptions)
        .where(inArray(paymentSubscriptions.customerId, customers));
    }
    return users.length;
  });

  const keep = db
    .select({ id: demoItems.id })
    .from(demoItems)
    .orderBy(desc(demoItems.updatedAt))
    .limit(CRUD_KEEP_ITEMS);
  const crud = await db
    .delete(demoItems)
    .where(sql`${demoItems.id} not in (${keep})`)
    .returning({ id: demoItems.id });

  const playground = await db
    .delete(playgroundDocuments)
    .where(
      lt(
        playgroundDocuments.createdAt,
        new Date(Date.now() - PLAYGROUND_RETENTION_HOURS * 3_600_000)
      )
    )
    .returning({ id: playgroundDocuments.id });

  return {
    rateLimitRows,
    spamMessages: spam.length,
    signupUsers,
    crudItems: crud.length,
    playgroundChunks: playground.length,
  };
}
