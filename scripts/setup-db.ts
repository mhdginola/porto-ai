import "./_loadEnv";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL not set. Check .env.local.");
  }

  const sql = postgres(url, { max: 1 });

  console.log("→ Enabling pgvector extension...");
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  console.log("✓ pgvector ready.");
  console.log("Next: run `npm run db:push` to create tables.");

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
