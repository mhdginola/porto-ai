export type ChatProvider = "groq" | "openai";

export type ModelOption = {
  id: string;
  label: string;
  description: string;
  badge?: "default" | "fast" | "reasoning" | "preview" | "premium";
  contextWindow?: number;
};

export const availableChatModels: Record<ChatProvider, ModelOption[]> = {
  groq: [
    {
      id: "llama-3.3-70b-versatile",
      label: "Llama 3.3 70B",
      description: "Balanced general-purpose, default choice",
      badge: "default",
      contextWindow: 131072,
    },
    {
      id: "llama-3.1-8b-instant",
      label: "Llama 3.1 8B",
      description: "Smallest & fastest, great for trivial tasks",
      badge: "fast",
      contextWindow: 131072,
    },
    {
      id: "qwen-qwq-32b",
      label: "Qwen QwQ 32B",
      description: "Reasoning-focused, shows thinking tokens",
      badge: "reasoning",
      contextWindow: 131072,
    },
    {
      id: "deepseek-r1-distill-llama-70b",
      label: "DeepSeek R1 Distill 70B",
      description: "Best for hard reasoning & math",
      badge: "reasoning",
      contextWindow: 131072,
    },
    {
      id: "gemma2-9b-it",
      label: "Gemma 2 9B",
      description: "Google open model, fast & accurate",
      badge: "fast",
      contextWindow: 8192,
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
};

export function getModelById(provider: ChatProvider, id: string) {
  return availableChatModels[provider].find((m) => m.id === id);
}

export function isValidModelId(provider: ChatProvider, id: string) {
  return availableChatModels[provider].some((m) => m.id === id);
}
