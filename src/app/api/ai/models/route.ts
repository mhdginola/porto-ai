import { aiInfo, CHAT_PROVIDER } from "@/lib/ai";
import { availableChatModels } from "@/lib/ai-models";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    provider: CHAT_PROVIDER,
    defaultModel: aiInfo.chatModel,
    models: availableChatModels[CHAT_PROVIDER],
    embedding: {
      provider: aiInfo.embeddingProvider,
      model: aiInfo.embeddingModel,
    },
  });
}
