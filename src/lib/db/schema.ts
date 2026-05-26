import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
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
