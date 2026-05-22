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
