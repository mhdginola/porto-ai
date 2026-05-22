import { createOpenAI, openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";
import { isValidModelId, type ChatProvider } from "@/lib/ai-models";

export type EmbeddingProvider = "ollama" | "openai";
export type { ChatProvider };

export const EMBEDDING_PROVIDER: EmbeddingProvider =
  (process.env.EMBEDDING_PROVIDER as EmbeddingProvider) ?? "ollama";

export const CHAT_PROVIDER: ChatProvider =
  (process.env.CHAT_PROVIDER as ChatProvider) ?? "groq";

export const EMBEDDING_DIM = EMBEDDING_PROVIDER === "ollama" ? 768 : 1536;

const EMBEDDING_MODEL =
  EMBEDDING_PROVIDER === "ollama"
    ? (process.env.OLLAMA_EMBEDDING_MODEL ?? "nomic-embed-text")
    : (process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small");

const CHAT_MODEL =
  CHAT_PROVIDER === "groq"
    ? (process.env.GROQ_CHAT_MODEL ?? "llama-3.3-70b-versatile")
    : (process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini");

const ollama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: process.env.OLLAMA_API_KEY ?? "ollama",
  compatibility: "compatible",
});

export function embeddingModel() {
  if (EMBEDDING_PROVIDER === "ollama") {
    return ollama.embedding(EMBEDDING_MODEL);
  }
  return openai.embedding(EMBEDDING_MODEL);
}

export function resolveChatModelId(modelId?: string): string {
  return modelId && isValidModelId(CHAT_PROVIDER, modelId)
    ? modelId
    : CHAT_MODEL;
}

export function chatModel(modelId?: string) {
  const id = resolveChatModelId(modelId);
  if (CHAT_PROVIDER === "groq") {
    return groq(id);
  }
  return openai(id);
}

export function aiModelResponseHeaders(requestedModel?: string) {
  return {
    "x-ai-model": resolveChatModelId(requestedModel),
    "x-ai-provider": CHAT_PROVIDER,
  };
}

export const aiInfo = {
  embeddingProvider: EMBEDDING_PROVIDER,
  embeddingModel: EMBEDDING_MODEL,
  embeddingDim: EMBEDDING_DIM,
  chatProvider: CHAT_PROVIDER,
  chatModel: CHAT_MODEL,
} as const;
