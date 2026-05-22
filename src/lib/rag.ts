import { cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { embedOne } from "@/lib/embeddings";
import { profile } from "@/content/profile";

export type RetrievedChunk = {
  id: number;
  source: string;
  sourceId: string;
  title: string;
  content: string;
  url: string | null;
  similarity: number;
};

export type RetrieveOptions = {
  topK?: number;
  minSimilarity?: number;
};

type SearchIntent = "experience" | "education" | "projects" | "skills" | "general";

const INTENT_PATTERNS: { intent: SearchIntent; pattern: RegExp }[] = [
  {
    intent: "experience",
    pattern:
      /pengalaman\s*(kerja|profesional)?|riwayat\s*kerja|karir|pekerjaan|work\s*experience|employment|job\s*history|where\s*(have\s*you|did\s*you)\s*work/i,
  },
  {
    intent: "education",
    pattern:
      /pendidikan|lulusan|kuliah|universitas|gpa|cum\s*laude|education|degree|university|graduate/i,
  },
  {
    intent: "projects",
    pattern:
      /project|proyek|portfolio|built|shipped|aml|blockchain|rag|portdex/i,
  },
  {
    intent: "skills",
    pattern:
      /skill|keahlian|stack|teknologi|tech|backend|frontend|database|devops|blockchain|ai\b/i,
  },
];

function detectIntent(query: string): SearchIntent {
  for (const { intent, pattern } of INTENT_PATTERNS) {
    if (pattern.test(query)) return intent;
  }
  return "general";
}

function augmentedQueries(query: string, intent: SearchIntent): string[] {
  const base = [query.trim()];
  const name = profile.name;

  switch (intent) {
    case "experience":
      return [
        ...base,
        `${name} work experience employment career job history programmer`,
        `${name} Portdex Asta Protek Jiarsi Fajar Lestari Freelance`,
      ];
    case "education":
      return [
        ...base,
        `${name} education degree university Universitas Negeri Padang GPA Cum Laude`,
      ];
    case "projects":
      return [...base, `${name} projects portfolio AML blockchain RAG`];
    case "skills":
      return [...base, `${name} technical skills stack backend frontend`];
    default:
      return base;
  }
}

function isBroadExperienceQuery(query: string): boolean {
  return (
    /pengalaman\s*(kerja|profesional)?|work\s*experience|employment|job\s*history|riwayat\s*kerja|karir|pekerjaan/i.test(
      query
    ) &&
    !/portdex|asta\s*protek|fajar|freelance|aml|blockchain/i.test(query)
  );
}

async function fetchAllExperienceChunks(): Promise<RetrievedChunk[]> {
  const rows = await db
    .select({
      id: documents.id,
      source: documents.source,
      sourceId: documents.sourceId,
      title: documents.title,
      content: documents.content,
      url: documents.url,
    })
    .from(documents)
    .where(eq(documents.source, "experience"))
    .orderBy(documents.id);

  return rows.map((row, index) => ({
    ...row,
    similarity: 1 - index * 0.001,
  }));
}

function sourceBoost(intent: SearchIntent, source: string): number {
  if (intent === "general") return 0;
  const preferred: Record<SearchIntent, string[]> = {
    experience: ["experience"],
    education: ["education"],
    projects: ["project"],
    skills: ["profile"],
    general: [],
  };
  return preferred[intent].includes(source) ? 0.12 : 0;
}

async function searchOnce(
  query: string,
  minSimilarity: number,
  fetchLimit: number
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedOne(query);

  const similarity = sql<number>`1 - (${cosineDistance(
    documents.embedding,
    queryEmbedding
  )})`;

  return db
    .select({
      id: documents.id,
      source: documents.source,
      sourceId: documents.sourceId,
      title: documents.title,
      content: documents.content,
      url: documents.url,
      similarity,
    })
    .from(documents)
    .where(gt(similarity, minSimilarity))
    .orderBy(desc(similarity))
    .limit(fetchLimit);
}

function mergeResults(
  batches: RetrievedChunk[][],
  intent: SearchIntent,
  topK: number
): RetrievedChunk[] {
  const byId = new Map<number, RetrievedChunk>();

  for (const batch of batches) {
    for (const row of batch) {
      const boosted = {
        ...row,
        similarity: row.similarity + sourceBoost(intent, row.source),
      };
      const prev = byId.get(row.id);
      if (!prev || boosted.similarity > prev.similarity) {
        byId.set(row.id, boosted);
      }
    }
  }

  const sorted = [...byId.values()].sort((a, b) => b.similarity - a.similarity);

  if (intent === "experience") {
    const experience = sorted.filter((r) => r.source === "experience");
    const rest = sorted.filter((r) => r.source !== "experience");
    // Include every experience chunk, then fill remaining slots
    const picked = [...experience, ...rest];
    const unique = new Map<number, RetrievedChunk>();
    for (const row of picked) unique.set(row.id, row);
    return [...unique.values()]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, Math.max(topK, experience.length));
  }

  return sorted.slice(0, topK);
}

export async function retrieveRelevantChunks(
  query: string,
  { topK = 8, minSimilarity = 0.22 }: RetrieveOptions = {}
): Promise<RetrievedChunk[]> {
  const intent = detectIntent(query);

  // Broad "list all jobs" questions → return every experience row from DB
  if (intent === "experience" && isBroadExperienceQuery(query)) {
    return fetchAllExperienceChunks();
  }

  const queries = augmentedQueries(query, intent);

  const batches = await Promise.all(
    queries.map((q) => searchOnce(q, minSimilarity, topK + 8))
  );

  return mergeResults(batches, intent, topK);
}

export function formatChunksForPrompt(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "(no relevant context retrieved)";
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] (${c.source}: ${c.title})\n${c.content.trim()}`
    )
    .join("\n\n");
}
