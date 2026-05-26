import type { ModelOption } from "@/lib/ai-models";

type OllamaTagsResponse = {
  models: Array<{
    name: string;
    details?: {
      parameter_size?: string;
      family?: string;
      families?: string[];
    };
  }>;
};

const EMBED_PATTERN = /embed/i;

export function ollamaApiBase(): string {
  const raw = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
  return raw.replace(/\/v1\/?$/, "");
}

export function isOllamaEmbeddingModel(name: string): boolean {
  return EMBED_PATTERN.test(name);
}

function formatModelLabel(name: string): string {
  const base = name.replace(/:latest$/, "").replace(/:.*$/, "");
  return base
    .replace(/([a-z])(\d)/gi, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function inferBadge(name: string): ModelOption["badge"] {
  const lower = name.toLowerCase();
  if (/coder|code/.test(lower)) return "reasoning";
  if (/phi|gemma|8b|7b|3b|small/.test(lower)) return "fast";
  if (/70b|large|mistral|llama3|llama-3/.test(lower)) return "default";
  return "local";
}

export function ollamaNameToOption(
  name: string,
  details?: OllamaTagsResponse["models"][0]["details"]
): ModelOption {
  const params = details?.parameter_size;
  return {
    id: name,
    label: formatModelLabel(name),
    description: params
      ? `Local Ollama · ${params}`
      : "Runs on your machine via Ollama",
    badge: inferBadge(name),
  };
}

export async function fetchOllamaChatModels(): Promise<ModelOption[]> {
  const base = ollamaApiBase();
  const res = await fetch(`${base}/api/tags`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`Ollama unreachable at ${base} (${res.status})`);
  }
  const data = (await res.json()) as OllamaTagsResponse;
  return (data.models ?? [])
    .filter((m) => !isOllamaEmbeddingModel(m.name))
    .map((m) => ollamaNameToOption(m.name, m.details));
}
