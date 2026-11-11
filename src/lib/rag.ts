import { and, cosineDistance, desc, eq, gt, isNotNull, sql } from "drizzle-orm";
import { EMBEDDINGS_ENABLED } from "@/lib/ai";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { embedOne } from "@/lib/embeddings";
import { profile } from "@/content/profile";

/**
 * Hybrid retrieval: pgvector similarity + Postgres full-text search, fused with
 * Reciprocal Rank Fusion. Keyword search needs no external API, so retrieval
 * keeps working when no embedding provider is available (EMBEDDING_PROVIDER=none),
 * and it catches exact terms (e.g. "Xendit") that embeddings can miss.
 */

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
    intent: "experience",
    pattern:
      /impact|achievement|contribut|dampak|kontribusi|prestasi|value\s*add|what\s*(have|did)\s*(you|he|ginola)|strongest|highlight|each\s*(work|job|role|company)|perusahaan/i,
  },
  {
    intent: "education",
    pattern:
      /pendidikan|lulusan|kuliah|universitas|sekolah|gpa|cum\s*laude|education|degree|university|graduate|stud(y|ied)|school/i,
  },
  {
    intent: "projects",
    pattern:
      /project|proyek|portfolio|built|shipped|\baml\b|blockchain|\brag\b|portdex/i,
  },
  {
    intent: "skills",
    pattern:
      // Word boundaries matter: a bare `ai\b` also matched "pakai".
      /skill|keahlian|stack|teknologi|tech|backend|frontend|database|devops|blockchain|\bai\b/i,
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

function needsFullExperienceContext(query: string): boolean {
  if (isBroadExperienceQuery(query)) return true;
  return (
    /impact|achievement|contribut|dampak|kontribusi|prestasi|value\s*add|strongest|highlight|each\s*(work|job|role|company|experience)|every\s*(role|job|company)|summary\s*of\s*impact|semua\s*(pengalaman|perusahaan)|what.{0,40}(impact|achievement|contribution|dampak)|how.{0,30}(impact|value|contribution)/i.test(
      query
    ) && !/portdex|asta\s*protek|fajar|freelance/i.test(query)
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

  const seen = new Set<string>();
  const unique = rows.filter((row) => {
    if (seen.has(row.title)) return false;
    seen.add(row.title);
    return true;
  });

  return unique.map((row, index) => ({
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

const SELECT_COLUMNS = {
  id: documents.id,
  source: documents.source,
  sourceId: documents.sourceId,
  title: documents.title,
  content: documents.content,
  url: documents.url,
};

async function searchVector(
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
    .select({ ...SELECT_COLUMNS, similarity })
    .from(documents)
    .where(and(isNotNull(documents.embedding), gt(similarity, minSimilarity)))
    .orderBy(desc(similarity))
    .limit(fetchLimit);
}

/* ---------- keyword (full-text) search ---------- */

/** EN + ID function words that would otherwise match every document. */
const STOPWORDS = new Set(
  `a an and are as at be been but by can could did do does for from had has have he her
  his how i if in into is it its me my of on or our she so than that the their them then
  there these they this to was we were what when where which who why will with would you
  your about any all also just more most other some such only own same very tell show give
  list please know ada adalah agar akan aku anda apa apakah atau bagaimana bahwa banyak
  beliau belum bisa boleh buat bukan dalam dan dari dengan di dia ini itu jadi juga kalau
  kami kamu kan karena ke kenapa kita mana masih mau mereka nya oleh pada para pernah punya
  saja saya sebagai sedang sekarang semua siapa sudah tahu tanya tentang tolong untuk yang
  sih dong deh kah lah mas mbak pak bu kak`
    .split(/\s+/)
    .filter(Boolean)
);

// The owner's name appears in almost every chunk, so it carries no signal.
for (const part of profile.name.toLowerCase().split(/\s+/)) STOPWORDS.add(part);

/** Small ID → EN bridge for terms whose documents are mostly in English. */
const SYNONYMS: Record<string, string[]> = {
  pembayaran: ["payment"],
  bayar: ["payment"],
  langganan: ["subscription"],
  berlangganan: ["subscription"],
  pengalaman: ["experience"],
  kerja: ["work"],
  pekerjaan: ["work", "job"],
  proyek: ["project"],
  projek: ["project"],
  keahlian: ["skills"],
  kemampuan: ["skills"],
  pendidikan: ["education"],
  study: ["education", "university"],
  studied: ["education", "university"],
  school: ["education"],
  kuliah: ["university", "education"],
  kampus: ["university"],
  perusahaan: ["company"],
  sertifikat: ["certification"],
  sertifikasi: ["certification"],
  publikasi: ["publication"],
  jurnal: ["publication"],
  integrasi: ["integration"],
  aplikasi: ["application", "app"],
  situs: ["website"],
  dasbor: ["dashboard"],
  keamanan: ["security"],
  pelanggan: ["customer"],
};

const MAX_KEYWORD_TERMS = 16;

/** Turn free text into a to_tsquery() string: OR of terms, prefix-matched when ≥ 4 chars. */
export function buildKeywordQuery(query: string): string | null {
  const tokens = query.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+/gu) ?? [];
  const terms = new Set<string>();
  for (const token of tokens) {
    if (token.length < 2 || STOPWORDS.has(token)) continue;
    terms.add(token);
    for (const synonym of SYNONYMS[token] ?? []) terms.add(synonym);
  }
  const list = [...terms].slice(0, MAX_KEYWORD_TERMS);
  if (list.length === 0) return null;
  // Tokens contain only letters/digits, so they are safe tsquery operands.
  return list.map((t) => (t.length >= 4 ? `${t}:*` : t)).join(" | ");
}

async function searchKeyword(query: string, fetchLimit: number): Promise<RetrievedChunk[]> {
  const tsquery = buildKeywordQuery(query);
  if (!tsquery) return [];
  const q = sql`to_tsquery('simple', ${tsquery})`;
  const rank = sql<number>`ts_rank(${documents.searchTsv}, ${q}, 32)`;
  return db
    .select({ ...SELECT_COLUMNS, similarity: rank })
    .from(documents)
    .where(sql`${documents.searchTsv} @@ ${q}`)
    .orderBy(desc(rank))
    .limit(fetchLimit);
}

/* ---------- fusion ---------- */

/** Reciprocal Rank Fusion constant (standard value from the RRF paper). */
const RRF_K = 60;
const SOURCE_BOOST = 1.25;

let vectorWarned = false;

/** Vector results for every query, or [] if embeddings are off / unavailable. */
async function vectorLists(
  queries: string[],
  minSimilarity: number,
  fetchLimit: number
): Promise<RetrievedChunk[][]> {
  if (!EMBEDDINGS_ENABLED) return [];
  try {
    return await Promise.all(queries.map((q) => searchVector(q, minSimilarity, fetchLimit)));
  } catch (err) {
    if (!vectorWarned) {
      vectorWarned = true;
      console.warn("[rag] vector search unavailable, using keyword search only:", err);
    }
    return [];
  }
}

/**
 * Fuse ranked lists with RRF (rank-based, so cosine similarities and ts_rank
 * scores never need to be on the same scale). `similarity` on the result is the
 * fused score normalised to 0–1.
 */
function fuseResults(
  lists: RetrievedChunk[][],
  intent: SearchIntent,
  topK: number
): RetrievedChunk[] {
  const scores = new Map<number, { row: RetrievedChunk; score: number }>();
  for (const list of lists) {
    list.forEach((row, index) => {
      const entry = scores.get(row.id) ?? { row, score: 0 };
      entry.score += 1 / (RRF_K + index + 1);
      scores.set(row.id, entry);
    });
  }

  const fused = [...scores.values()].map(({ row, score }) => ({
    ...row,
    similarity: score * (sourceBoost(intent, row.source) > 0 ? SOURCE_BOOST : 1),
  }));
  const max = Math.max(...fused.map((r) => r.similarity), 0) || 1;
  const sorted = fused
    .map((r) => ({ ...r, similarity: r.similarity / max }))
    .sort((a, b) => b.similarity - a.similarity);

  if (intent === "experience") {
    // Include every experience chunk, then fill remaining slots.
    const experience = sorted.filter((r) => r.source === "experience");
    return sorted.slice(0, Math.max(topK, experience.length));
  }

  return sorted.slice(0, topK);
}

export async function retrieveRelevantChunks(
  query: string,
  { topK = 8, minSimilarity = 0.22 }: RetrieveOptions = {}
): Promise<RetrievedChunk[]> {
  const intent = detectIntent(query);

  // Broad experience / impact questions → return every role from DB
  if (intent === "experience" && needsFullExperienceContext(query)) {
    return fetchAllExperienceChunks();
  }

  const queries = augmentedQueries(query, intent);
  const fetchLimit = topK + 8;

  const [vector, keyword] = await Promise.all([
    vectorLists(queries, minSimilarity, fetchLimit),
    Promise.all(queries.map((q) => searchKeyword(q, fetchLimit))),
  ]);

  return fuseResults([...vector, ...keyword], intent, topK);
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
