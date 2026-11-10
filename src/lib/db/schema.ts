import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";

export const EMBEDDING_DIM = 768;

export const documents = pgTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    source: text("source").notNull(),
    sourceId: text("source_id").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    content: text("content").notNull(),
    metadata: text("metadata"),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIM }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("documents_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export const playgroundDocuments = pgTable(
  "playground_documents",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    filename: text("filename").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    pageHint: text("page_hint"),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIM }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("playground_documents_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
    index("playground_documents_session_idx").on(table.sessionId),
  ]
);

export type PlaygroundDocument = typeof playgroundDocuments.$inferSelect;
export type NewPlaygroundDocument = typeof playgroundDocuments.$inferInsert;

/** Demo items for the public Simple CRUD project (/projects/crud-demo). */
export const demoItems = pgTable("demo_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type DemoItem = typeof demoItems.$inferSelect;
export type NewDemoItem = typeof demoItems.$inferInsert;

/** Demo users for Simple Auth + Roles project (/projects/auth-demo). */
export const demoUsers = pgTable("demo_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DemoUser = typeof demoUsers.$inferSelect;
export type NewDemoUser = typeof demoUsers.$inferInsert;

/** Per-role module access for auth demo RBAC (editable by superadmin). */
export const demoRolePermissions = pgTable(
  "demo_role_permissions",
  {
    id: serial("id").primaryKey(),
    role: text("role").notNull(),
    moduleId: text("module_id").notNull(),
    allowed: boolean("allowed").notNull().default(false),
  },
  (table) => [
    uniqueIndex("demo_role_permissions_role_module_idx").on(
      table.role,
      table.moduleId
    ),
  ]
);

export type DemoRolePermission = typeof demoRolePermissions.$inferSelect;
export type NewDemoRolePermission = typeof demoRolePermissions.$inferInsert;

/** Property agency websites built in /projects/property-agency-builder. */
export const propertyAgencySites = pgTable(
  "property_agency_sites",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    config: text("config").notNull(),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("property_agency_sites_slug_idx").on(table.slug)]
);

export type PropertyAgencySite = typeof propertyAgencySites.$inferSelect;
export type NewPropertyAgencySite = typeof propertyAgencySites.$inferInsert;

/* ---------- Payment & Subscription demo — Xendit mode ---------- */

/** One subscription per anonymous demo visitor (cookie `pay_demo_cid`). */
export const paymentSubscriptions = pgTable("payment_subscriptions", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().unique(),
  planId: text("plan_id").notNull(),
  cycle: text("cycle").notNull(),
  /** active | ended */
  status: text("status").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  scheduledPlanId: text("scheduled_plan_id"),
  scheduledCycle: text("scheduled_cycle"),
  /** Last Xendit channel used to pay, e.g. "BCA", "QRIS", "OVO". */
  paymentChannel: text("payment_channel"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PaymentSubscriptionRow = typeof paymentSubscriptions.$inferSelect;

export const paymentInvoices = pgTable(
  "payment_invoices",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull(),
    /** Our reference sent to Xendit as `external_id`. */
    externalId: text("external_id").notNull().unique(),
    xenditInvoiceId: text("xendit_invoice_id"),
    invoiceUrl: text("invoice_url"),
    number: text("number").notNull(),
    /** subscription_create | subscription_update | subscription_cycle */
    reason: text("reason").notNull(),
    planId: text("plan_id").notNull(),
    cycle: text("cycle").notNull(),
    lines: jsonb("lines").$type<{ description: string; amount: number }[]>().notNull(),
    subtotal: integer("subtotal").notNull(),
    tax: integer("tax").notNull(),
    total: integer("total").notNull(),
    /** PENDING | PAID | EXPIRED */
    status: text("status").notNull(),
    paymentMethod: text("payment_method"),
    paymentChannel: text("payment_channel"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("payment_invoices_customer_idx").on(table.customerId, table.createdAt),
  ]
);

export type PaymentInvoiceRow = typeof paymentInvoices.$inferSelect;

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull(),
    type: text("type").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    /** Set for inbound Xendit callbacks so retries are recorded once. */
    dedupeKey: text("dedupe_key").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("payment_events_customer_idx").on(table.customerId, table.createdAt),
  ]
);

/* ---------- Smart contact form ---------- */

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    message: text("message").notNull(),
    locale: text("locale").notNull().default("en"),
    /** job_offer | freelance | collaboration | question | spam | other — null if AI failed */
    category: text("category"),
    /** AI confidence 0–100 */
    confidence: integer("confidence"),
    /** high | normal | low */
    priority: text("priority"),
    summary: text("summary"),
    suggestedReply: text("suggested_reply"),
    aiModel: text("ai_model"),
    aiError: text("ai_error"),
    /** new | spam | read | archived */
    status: text("status").notNull().default("new"),
    /** Salted SHA-256 of the client IP — for rate limiting, never the raw IP. */
    ipHash: text("ip_hash").notNull(),
    userAgent: text("user_agent"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    autoRepliedAt: timestamp("auto_replied_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("contact_messages_ip_idx").on(table.ipHash, table.createdAt),
    index("contact_messages_email_idx").on(table.email, table.createdAt),
  ]
);

export type ContactMessageRow = typeof contactMessages.$inferSelect;
