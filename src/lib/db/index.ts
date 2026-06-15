import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __pg_client: ReturnType<typeof postgres> | undefined;
  var __pg_db: PostgresJsDatabase<typeof schema> | undefined;
}

function resolveDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.example)."
    );
  }
  return connectionString;
}

function createDbClient() {
  const connectionString = resolveDatabaseUrl();

  try {
    const client =
      globalThis.__pg_client ??
      postgres(connectionString, {
        max: 1,
        prepare: false,
      });

    if (process.env.NODE_ENV !== "production") {
      globalThis.__pg_client = client;
    }

    return drizzle(client, { schema });
  } catch (error) {
    if (
      error instanceof TypeError &&
      String(error.message).includes("Invalid URL")
    ) {
      throw new Error(
        "DATABASE_URL is malformed. URL-encode special characters in the password (e.g. # → %23, @ → %40)."
      );
    }
    throw error;
  }
}

function getDb() {
  if (!globalThis.__pg_db) {
    globalThis.__pg_db = createDbClient();
  }
  return globalThis.__pg_db;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});

export { schema };
