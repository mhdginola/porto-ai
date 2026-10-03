export type ChatProvider = "groq" | "openai" | "ollama";

/** Providers shown together in the model picker (Groq cloud + Ollama local). */
export const UI_CHAT_PROVIDERS: ChatProvider[] = ["groq", "ollama"];

export type ModelGroup = {
  provider: ChatProvider;
  models: ModelOption[];
  available: boolean;
};

export type ModelOption = {
  id: string;
  label: string;
  description: string;
  badge?:
    | "default"
    | "fast"
    | "reasoning"
    | "preview"
    | "premium"
    | "local";
  contextWindow?: number;
};

/**
 * Groq retired the Llama 3.x models for free/developer tiers on 2026-08-16
 * (https://console.groq.com/docs/deprecations) — only production models that
 * the free tier can call are listed here.
 */
export const DEFAULT_GROQ_MODEL_ID = "openai/gpt-oss-120b";

export const availableChatModels: Record<ChatProvider, ModelOption[]> = {
  groq: [
    {
      id: DEFAULT_GROQ_MODEL_ID,
      label: "GPT-OSS 120B",
      description: "OpenAI open-weight model, balanced default choice",
      badge: "default",
      contextWindow: 131072,
    },
    {
      id: "openai/gpt-oss-20b",
      label: "GPT-OSS 20B",
      description: "Smallest & fastest, great for quick answers",
      badge: "fast",
      contextWindow: 131072,
    },
  ],
  openai: [
    {
      id: "gpt-4o-mini",
      label: "GPT-4o mini",
      description: "Cheap & fast, excellent default",
      badge: "default",
      contextWindow: 128000,
    },
    {
      id: "gpt-4o",
      label: "GPT-4o",
      description: "Flagship multimodal",
      badge: "premium",
      contextWindow: 128000,
    },
    {
      id: "o3-mini",
      label: "o3-mini",
      description: "Advanced reasoning model",
      badge: "reasoning",
      contextWindow: 200000,
    },
  ],
  ollama: [
    {
      id: "Llama3:latest",
      label: "Llama 3",
      description: "Local Ollama · 8B — balanced default",
      badge: "default",
    },
    {
      id: "mistral:latest",
      label: "Mistral",
      description: "Local Ollama · 7.2B",
      badge: "default",
    },
    {
      id: "qwen2.5-coder:latest",
      label: "Qwen 2.5 Coder",
      description: "Local Ollama · 7.6B — code-focused",
      badge: "reasoning",
    },
    {
      id: "phi3:latest",
      label: "Phi 3",
      description: "Local Ollama · 3.8B — fast & small",
      badge: "fast",
    },
  ],
};

export function getModelById(
  provider: ChatProvider,
  id: string,
  models?: ModelOption[]
) {
  const list = models ?? availableChatModels[provider] ?? [];
  return list.find((m) => m.id === id);
}

export function isValidModelId(
  provider: ChatProvider,
  id: string,
  models?: ModelOption[]
) {
  const list = models ?? availableChatModels[provider] ?? [];
  if (provider === "ollama" && list.length === 0) {
    return id.trim().length > 0 && !/embed/i.test(id);
  }
  return list.some((m) => m.id === id);
}
