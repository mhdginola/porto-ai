import { createOpenAI, openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";
import {
  isValidModelId,
  type ChatProvider,
  type ModelGroup,
  type ModelOption,
} from "@/lib/ai-models";
import {
  encodeModelRef,
  parseModelRef,
} from "@/lib/chat-model-ref";

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
    : CHAT_PROVIDER === "ollama"
      ? (process.env.OLLAMA_CHAT_MODEL ?? "Llama3:latest")
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

export function getDefaultModelRef(): string {
  if (CHAT_PROVIDER === "ollama") {
    return encodeModelRef("ollama", CHAT_MODEL);
  }
  if (CHAT_PROVIDER === "groq") {
    return encodeModelRef("groq", CHAT_MODEL);
  }
  return encodeModelRef("openai", CHAT_MODEL);
}

function isChatProviderConfigured(provider: ChatProvider): boolean {
  if (provider === "groq") return Boolean(process.env.GROQ_API_KEY?.trim());
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY?.trim());
  return true;
}

function isResolvableModelRef(
  provider: ChatProvider,
  modelId: string,
  models?: ModelOption[]
): boolean {
  if (provider === "ollama") {
    return modelId.trim().length > 0 && !/embed/i.test(modelId);
  }
  return isValidModelId(provider, modelId, models);
}

export function resolveChatModelRef(
  modelRef?: string,
  groups?: ModelGroup[]
): { provider: ChatProvider; modelId: string } {
  const parsed = modelRef ? parseModelRef(modelRef) : null;
  if (parsed) {
    const group = groups?.find((g) => g.provider === parsed.provider);
    if (
      group?.available &&
      isValidModelId(parsed.provider, parsed.modelId, group.models)
    ) {
      return parsed;
    }
    if (
      !groups &&
      isChatProviderConfigured(parsed.provider) &&
      isResolvableModelRef(parsed.provider, parsed.modelId)
    ) {
      return parsed;
    }
  }
  return { provider: CHAT_PROVIDER, modelId: CHAT_MODEL };
}

export function chatModel(modelRef?: string) {
  const { provider, modelId } = resolveChatModelRef(modelRef);
  if (provider === "groq") {
    return groq(modelId);
  }
  if (provider === "ollama") {
    return ollama(modelId);
  }
  return openai(modelId);
}

export function aiModelResponseHeaders(requestedModelRef?: string) {
  const { provider, modelId } = resolveChatModelRef(requestedModelRef);
  return {
    "x-ai-model": modelId,
    "x-ai-provider": provider,
    "x-ai-model-ref": encodeModelRef(provider, modelId),
  };
}

export const aiInfo = {
  embeddingProvider: EMBEDDING_PROVIDER,
  embeddingModel: EMBEDDING_MODEL,
  embeddingDim: EMBEDDING_DIM,
  chatProvider: CHAT_PROVIDER,
  chatModel: CHAT_MODEL,
} as const;
