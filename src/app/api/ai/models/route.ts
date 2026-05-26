import { aiInfo, getDefaultModelRef } from "@/lib/ai";
import { availableChatModels, UI_CHAT_PROVIDERS } from "@/lib/ai-models";
import { encodeModelRef } from "@/lib/chat-model-ref";
import { fetchOllamaChatModels } from "@/lib/ollama-models";

export const runtime = "nodejs";

export async function GET() {
  const groqAvailable = Boolean(process.env.GROQ_API_KEY?.trim());
  let ollamaConnected = false;
  let ollamaModels = availableChatModels.ollama;

  try {
    ollamaModels = await fetchOllamaChatModels();
    ollamaConnected = ollamaModels.length > 0;
  } catch (err) {
    console.warn("[api/ai/models] Ollama fetch failed:", err);
  }

  const groups = UI_CHAT_PROVIDERS.map((provider) => {
    if (provider === "groq") {
      return {
        provider,
        models: availableChatModels.groq,
        available: groqAvailable,
      };
    }
    return {
      provider,
      models: ollamaModels,
      available: ollamaConnected,
    };
  });

  const groqDefault =
    availableChatModels.groq.find(
      (m) => m.id === (process.env.GROQ_CHAT_MODEL ?? "llama-3.3-70b-versatile")
    )?.id ?? availableChatModels.groq[0]?.id;

  const ollamaDefault =
    ollamaModels.find(
      (m) => m.id === (process.env.OLLAMA_CHAT_MODEL ?? "Llama3:latest")
    )?.id ?? ollamaModels[0]?.id;

  const defaultModelRef = groqAvailable
    ? encodeModelRef("groq", groqDefault ?? "llama-3.3-70b-versatile")
    : ollamaDefault
      ? encodeModelRef("ollama", ollamaDefault)
      : getDefaultModelRef();

  return Response.json({
    groups,
    defaultModelRef,
    ollamaConnected,
    groqAvailable,
    embedding: {
      provider: aiInfo.embeddingProvider,
      model: aiInfo.embeddingModel,
    },
  });
}
