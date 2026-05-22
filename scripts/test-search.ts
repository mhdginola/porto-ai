import "./_loadEnv";
import { retrieveRelevantChunks } from "@/lib/rag";

async function main() {
  const queries = [
    "pengalaman kerja ginola?",
    "ginola's work experience?",
    "Pernah ngerjain project anti money laundering atau compliance?",
  ];

  for (const q of queries) {
    console.log(`\n──────── Query: "${q}" ────────`);
    const results = await retrieveRelevantChunks(q, { topK: 3 });
    for (const r of results) {
      console.log(
        `  [${r.similarity.toFixed(3)}] (${r.source}) ${r.title}\n    ${r.content.slice(0, 100)}...`
      );
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
