import { embed, embedMany } from "ai";
import { embeddingModel } from "@/lib/ai";

export async function embedOne(value: string) {
  const { embedding } = await embed({
    model: embeddingModel(),
    value,
  });
  return embedding;
}

export async function embedBatch(values: string[]) {
  const { embeddings } = await embedMany({
    model: embeddingModel(),
    values,
  });
  return embeddings;
}
