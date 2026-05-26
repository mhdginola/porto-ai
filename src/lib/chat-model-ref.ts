import {
  type ChatProvider,
  type ModelGroup,
  type ModelOption,
  isValidModelId,
} from "@/lib/ai-models";

export function encodeModelRef(
  provider: ChatProvider,
  modelId: string
): string {
  return `${provider}:${modelId}`;
}

export function parseModelRef(
  ref: string
): { provider: ChatProvider; modelId: string } | null {
  const idx = ref.indexOf(":");
  if (idx <= 0) return null;
  const provider = ref.slice(0, idx) as ChatProvider;
  const modelId = ref.slice(idx + 1);
  if (provider !== "groq" && provider !== "openai" && provider !== "ollama") {
    return null;
  }
  if (!modelId.trim() || /embed/i.test(modelId)) return null;
  return { provider, modelId };
}

export function findModelInGroups(
  modelRef: string,
  groups: ModelGroup[]
): (ModelOption & { provider: ChatProvider }) | undefined {
  const parsed = parseModelRef(modelRef);
  if (!parsed) return undefined;
  const group = groups.find((g) => g.provider === parsed.provider);
  const model = group?.models.find((m) => m.id === parsed.modelId);
  if (!model) return undefined;
  return { ...model, provider: parsed.provider };
}

export function isValidModelRef(ref: string, groups: ModelGroup[]): boolean {
  const parsed = parseModelRef(ref);
  if (!parsed) return false;
  const group = groups.find((g) => g.provider === parsed.provider);
  if (!group?.available) return false;
  return isValidModelId(parsed.provider, parsed.modelId, group.models);
}
