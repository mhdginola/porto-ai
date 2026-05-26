import {
  and,
  asc,
  cosineDistance,
  desc,
  eq,
  gt,
  inArray,
  sql,
} from "drizzle-orm";
import { db } from "@/lib/db";
import { playgroundDocuments } from "@/lib/db/schema";
import { embedOne } from "@/lib/embeddings";

export type PlaygroundRetrievedChunk = {
  id: number;
  chunkIndex: number;
  content: string;
  similarity: number;
};

const TOP_K = 12;
const MIN_SIMILARITY = 0.18;
const VECTOR_WEIGHT = 0.72;
const ADJACENT_RADIUS = 3;

function expandPlaygroundQueries(query: string): string[] {
  const q = query.trim();
  if (!q) return [];

  const expanded = new Set<string>([q]);

  if (/\bpjk\b/i.test(q) && /terdiri|apa\s+saja|jenis|macam|daftar/i.test(q)) {
    expanded.add("Pasal 2 PJK terdiri atas bank perusahaan efek manajer investasi");
    expanded.add(
      "lembaga jasa keuangan lainnya prinsip konvensional syariah"
    );
  }
  if (/terdiri|apa\s+saja|consist/i.test(q)) {
    expanded.add(`${q} Pasal terdiri atas`);
  }
  if (
    /\b(ringkas|summarize|ringkasan|summary|kesimpulan|outline)\b/i.test(q) &&
    /\b(isi|dokumen|pdf|ini|seluruh|keseluruhan)\b/i.test(q)
  ) {
    expanded.add(
      "tujuan ruang lingkup ketentuan umum pengelolaan risiko APU PPT PPSPM"
    );
    expanded.add("Pasal 1 Pasal 2 Pasal 3 PJK Otoritas Jasa Keuangan");
  }

  return [...expanded].slice(0, 4);
}

function keywordBoost(query: string, content: string): number {
  const q = query.toLowerCase();
  const c = content.toLowerCase();
  let score = 0;

  for (const token of q.split(/\s+/).filter((t) => t.length > 2)) {
    if (c.includes(token)) score += 1;
  }

  if (/\bpjk\b/i.test(q) && c.includes("pjk")) score += 2;
  if (/terdiri/i.test(q) && /terdiri\s+(atas|dari)/i.test(c)) score += 3;
  if (/pasal\s*2/i.test(c) && /terdiri\s+atas/i.test(c)) score += 4;
  if (/\s[a-z]\.\s/.test(content) && /terdiri|apa\s+saja|daftar/i.test(q)) {
    score += 2;
  }

  return score;
}

function combinedScore(
  vectorSimilarity: number,
  keywordScore: number,
  maxKeyword: number
): number {
  const kw = maxKeyword > 0 ? keywordScore / maxKeyword : 0;
  return vectorSimilarity * VECTOR_WEIGHT + kw * (1 - VECTOR_WEIGHT);
}

/** Pasal 2 list continues on the next page — need neighbor chunks. */
export function listContinuationNeeded(content: string): boolean {
  if (!/\bterdiri\s+atas\b/i.test(content)) return false;
  if (
    /lembaga jasa keuangan lainnya|prinsip konvensional maupun syariah/i.test(
      content
    )
  ) {
    return false;
  }
  const letters = [
    ...content.matchAll(/\s([a-z])\.\s/gi),
  ].map((m) => m[1].toLowerCase());
  if (letters.length < 3) return false;
  const last = letters[letters.length - 1];
  return last < "q";
}

function needsAdjacentExpansion(
  query: string,
  chunk: PlaygroundRetrievedChunk
): boolean {
  if (listContinuationNeeded(chunk.content)) return true;
  if (
    /\bpjk\b/i.test(query) &&
    /pasal\s*2|terdiri\s+atas/i.test(chunk.content)
  ) {
    return true;
  }
  return false;
}

async function loadChunksByIndex(
  sessionId: string,
  indices: number[]
): Promise<PlaygroundRetrievedChunk[]> {
  if (indices.length === 0) return [];

  const rows = await db
    .select({
      id: playgroundDocuments.id,
      chunkIndex: playgroundDocuments.chunkIndex,
      content: playgroundDocuments.content,
    })
    .from(playgroundDocuments)
    .where(
      and(
        eq(playgroundDocuments.sessionId, sessionId),
        inArray(playgroundDocuments.chunkIndex, indices)
      )
    )
    .orderBy(asc(playgroundDocuments.chunkIndex));

  return rows.map((r) => ({
    ...r,
    similarity: 0,
  }));
}

/** Merge consecutive chunk indices so split Pasal 2 lists stay in one context block. */
export function mergeConsecutiveChunks(
  chunks: PlaygroundRetrievedChunk[]
): PlaygroundRetrievedChunk[] {
  if (chunks.length <= 1) return chunks;

  const sorted = [...chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
  const merged: PlaygroundRetrievedChunk[] = [];
  let group: PlaygroundRetrievedChunk[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = group[group.length - 1];
    const curr = sorted[i];
    const consecutive = curr.chunkIndex === prev.chunkIndex + 1;
    const prevPasal = prev.content.match(/pasal\s*(\d+)/i)?.[1];
    const currPasal = curr.content.match(/pasal\s*(\d+)/i)?.[1];
    const samePasal = prevPasal && currPasal && prevPasal === currPasal;
    const prevList = /\s[a-z]\.\s/i.test(prev.content);
    const currList = /\s[a-z]\.\s/i.test(curr.content);
    const listSplit =
      consecutive &&
      (listContinuationNeeded(prev.content) ||
        listContinuationNeeded(curr.content) ||
        samePasal ||
        (prevList && currList && /terdiri\s+atas|pasal\s*2/i.test(prev.content)));

    if (listSplit) {
      group.push(curr);
    } else {
      merged.push(mergeGroup(group));
      group = [curr];
    }
  }
  merged.push(mergeGroup(group));
  return merged;
}

function mergeGroup(
  group: PlaygroundRetrievedChunk[]
): PlaygroundRetrievedChunk {
  if (group.length === 1) return group[0];
  return {
    id: group[0].id,
    chunkIndex: group[0].chunkIndex,
    content: group.map((g) => g.content.trim()).join("\n"),
    similarity: Math.max(...group.map((g) => g.similarity)),
  };
}

export async function retrievePlaygroundChunks(
  sessionId: string,
  query: string
): Promise<{ chunks: PlaygroundRetrievedChunk[]; maxSimilarity: number }> {
  const queries = expandPlaygroundQueries(query);
  const byId = new Map<number, PlaygroundRetrievedChunk>();

  for (const q of queries) {
    const queryEmbedding = await embedOne(q);
    const similarity = sql<number>`1 - (${cosineDistance(
      playgroundDocuments.embedding,
      queryEmbedding
    )})`;

    const rows = await db
      .select({
        id: playgroundDocuments.id,
        chunkIndex: playgroundDocuments.chunkIndex,
        content: playgroundDocuments.content,
        similarity,
      })
      .from(playgroundDocuments)
      .where(
        and(
          eq(playgroundDocuments.sessionId, sessionId),
          gt(similarity, MIN_SIMILARITY)
        )
      )
      .orderBy(desc(similarity))
      .limit(20);

    for (const row of rows) {
      const prev = byId.get(row.id);
      if (!prev || row.similarity > prev.similarity) {
        byId.set(row.id, row);
      }
    }
  }

  const merged = [...byId.values()];
  if (merged.length === 0) {
    return { chunks: [], maxSimilarity: 0 };
  }

  const maxKeyword = Math.max(
    ...merged.map((r) => keywordBoost(query, r.content)),
    1
  );

  const ranked = merged
    .map((r) => ({
      ...r,
      rank: combinedScore(
        r.similarity,
        keywordBoost(query, r.content),
        maxKeyword
      ),
    }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, TOP_K);

  const indicesToLoad = new Set<number>();
  for (const chunk of ranked) {
    if (!needsAdjacentExpansion(query, chunk)) continue;
    for (let d = -ADJACENT_RADIUS; d <= ADJACENT_RADIUS; d++) {
      if (d === 0) continue;
      indicesToLoad.add(chunk.chunkIndex + d);
    }
  }

  const existingIndices = new Set(ranked.map((r) => r.chunkIndex));
  const missing = [...indicesToLoad].filter(
    (i) => i >= 0 && !existingIndices.has(i)
  );

  if (missing.length > 0) {
    const neighbors = await loadChunksByIndex(sessionId, missing);
    for (const n of neighbors) {
      if (!byId.has(n.id)) {
        ranked.push({ ...n, rank: 0 });
      }
    }
  }

  const final = mergeConsecutiveChunks(ranked).slice(0, 10);
  const maxSimilarity = Math.max(
    ...ranked.map((r) => r.similarity),
    0
  );

  return {
    chunks: final.map(({ id, chunkIndex, content, similarity }) => ({
      id,
      chunkIndex,
      content,
      similarity,
    })),
    maxSimilarity,
  };
}
