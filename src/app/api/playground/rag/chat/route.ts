import {
  createDataStreamResponse,
  formatDataStreamPart,
  streamText,
  type Message,
} from "ai";
import { aiModelResponseHeaders, chatModel } from "@/lib/ai";
import {
  miniRagLanguageInstruction,
  miniRagListInstruction,
  miniRagNotFoundMessage,
  miniRagScopeInstruction,
  miniRagSummarizeInstruction,
} from "@/lib/i18n/locale-prompt";
import { retrievePlaygroundChunks } from "@/lib/playground-retrieval";
import {
  isDocumentSummaryQuery,
  miniRagOffTopicMessage,
  shouldRefuseOffTopic,
} from "@/lib/mini-rag-guard";

export const runtime = "nodejs";
export const maxDuration = 30;

function buildSystem(locale?: string, query?: string) {
  const notFound = miniRagNotFoundMessage(locale);
  const summarize = query && isDocumentSummaryQuery(query);
  return `You are an AI assistant that ONLY answers questions about a PDF the user uploaded.

Rules:
${miniRagScopeInstruction(locale)}
${summarize ? miniRagSummarizeInstruction(locale) : ""}
${miniRagListInstruction(locale)}
- Use ONLY the retrieved context below. If the answer is not in the context, say exactly: "${notFound}"
- Never answer from general knowledge, training data, or tasks unrelated to the PDF.
- Cite passages inline using [1], [2], ... matching the numbered context items.
${miniRagLanguageInstruction(locale)}
- Be concise. Quote short phrases from the source when helpful.`;
}

function refusalResponse(
  message: string,
  model: string | undefined,
  sources: Array<{ id: number; chunkIndex: number; preview: string }>
) {
  return createDataStreamResponse({
    headers: {
      "x-rag-sources": encodeURIComponent(JSON.stringify(sources)),
      ...aiModelResponseHeaders(model),
    },
    execute(dataStream) {
      dataStream.write(formatDataStreamPart("text", message));
      dataStream.write(
        formatDataStreamPart("finish_message", { finishReason: "stop" })
      );
    },
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: Message[];
    sessionId?: string;
    model?: string;
    locale?: string;
  };
  const { messages, sessionId, model, locale } = body;

  if (!sessionId) {
    return Response.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const query = typeof lastUser?.content === "string" ? lastUser.content : "";

  let context = "(no context)";
  let sources: Array<{ id: number; chunkIndex: number; preview: string }> = [];
  let maxSimilarity = 0;

  if (query.trim()) {
    try {
      const { chunks, maxSimilarity: topSim } =
        await retrievePlaygroundChunks(sessionId, query);
      maxSimilarity = topSim;

      if (chunks.length > 0) {
        context = chunks
          .map((r, i) => `[${i + 1}] ${r.content.trim()}`)
          .join("\n\n");
        sources = chunks.map((r, i) => ({
          id: i + 1,
          chunkIndex: r.chunkIndex,
          preview: r.content.slice(0, 120) + (r.content.length > 120 ? "…" : ""),
        }));
      }
    } catch (err) {
      console.error("[mini-rag/chat] retrieval failed:", err);
    }
  }

  if (
    query.trim() &&
    shouldRefuseOffTopic(query, maxSimilarity, sources.length > 0)
  ) {
    return refusalResponse(miniRagOffTopicMessage(locale), model, []);
  }

  const ragMessages = lastUser
    ? [{ role: "user" as const, content: lastUser.content }]
    : messages.filter((m) => m.role === "user").slice(-1);

  const result = streamText({
    model: chatModel(model),
    system: `${buildSystem(locale, query)}\n\n# Retrieved context from the PDF\n${context}`,
    messages: ragMessages,
    temperature: 0,
  });

  return result.toDataStreamResponse({
    headers: {
      "x-rag-sources": encodeURIComponent(JSON.stringify(sources)),
      ...aiModelResponseHeaders(model),
    },
    getErrorMessage: (error) => {
      console.error("[mini-rag/chat] stream error:", error);
      if (error instanceof Error) {
        if (/api[_ ]?key/i.test(error.message)) {
          return "Missing or invalid API key — check GROQ_API_KEY or CHAT_PROVIDER in .env.local.";
        }
        if (/fetch failed|ECONNREFUSED|ollama/i.test(error.message)) {
          return "Cannot reach Ollama — run `ollama serve` on port 11434.";
        }
        return error.message;
      }
      return "Stream failed.";
    },
  });
}
