import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local (see .env.example)."
  );
}

declare global {
  var __pg_client: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis.__pg_client ??
  postgres(connectionString, {
    max: 1,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pg_client = client;
}

export const db = drizzle(client, { schema });
export { schema };
