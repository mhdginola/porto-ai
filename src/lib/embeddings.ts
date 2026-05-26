import { embed, embedMany } from "ai";
import { EMBEDDING_PROVIDER, embeddingModel } from "@/lib/ai";

/**
 * nomic-embed-text on Ollama: n_ctx_train=2048.
 * Long chunks + batched requests trigger num_ctx=8192 and SIGTRAP crashes.
 */
export const OLLAMA_EMBED_MAX_CHARS = 1400;

/** One text per request — avoids Ollama batching many sequences into one decode. */
const OLLAMA_EMBED_BATCH_SIZE = 1;
const MAX_RETRIES = 2;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function truncateForEmbedding(text: string): string {
  const t = text.trim();
  if (t.length <= OLLAMA_EMBED_MAX_CHARS) return t;
  return t.slice(0, OLLAMA_EMBED_MAX_CHARS);
}

function prepareValues(values: string[]): string[] {
  if (EMBEDDING_PROVIDER !== "ollama") return values;
  return values.map(truncateForEmbedding);
}

async function embedManyWithRetry(values: string[]) {
  const prepared = prepareValues(values);
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { embeddings } = await embedMany({
        model: embeddingModel(),
        values: prepared,
      });
      return embeddings;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) await sleep(500 * (attempt + 1));
    }
  }
  throw lastError;
}

export async function embedOne(value: string) {
  const { embedding } = await embed({
    model: embeddingModel(),
    value: truncateForEmbedding(value),
  });
  return embedding;
}

export async function embedBatch(values: string[]): Promise<number[][]> {
  if (values.length === 0) return [];

  const all: number[][] = [];
  for (let i = 0; i < values.length; i += OLLAMA_EMBED_BATCH_SIZE) {
    const slice = values.slice(i, i + OLLAMA_EMBED_BATCH_SIZE);
    const batch = await embedManyWithRetry(slice);
    all.push(...batch);
  }
  return all;
}

export function formatEmbeddingError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/ECONNREFUSED|fetch failed|connect/i.test(msg)) {
    return "Ollama tidak terjangkau. Jalankan `ollama serve` lalu coba lagi.";
  }
  if (/context|2048|8192|too large/i.test(msg)) {
    return "Teks chunk terlalu panjang untuk nomic-embed-text (maks 2048 token). Coba upload ulang — chunk sudah dibatasi otomatis.";
  }
  if (/EOF|500|SIGTRAP|embedding/i.test(msg)) {
    return "Ollama crash saat embedding — biasanya karena chunk terlalu panjang atau terlalu banyak sekaligus. Tunggu beberapa detik lalu coba lagi.";
  }
  return `Embedding gagal: ${msg.slice(0, 160)}`;
}
