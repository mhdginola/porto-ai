import { streamText, type Message } from "ai";
import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { aiModelResponseHeaders, chatModel } from "@/lib/ai";
import { db } from "@/lib/db";
import { playgroundDocuments } from "@/lib/db/schema";
import { embedOne } from "@/lib/embeddings";
import {
  miniRagLanguageInstruction,
  miniRagNotFoundMessage,
} from "@/lib/i18n/locale-prompt";

export const runtime = "nodejs";
export const maxDuration = 30;

function buildSystem(locale?: string) {
  const notFound = miniRagNotFoundMessage(locale);
  return `You are an AI assistant answering questions about a PDF the user just uploaded.

Rules:
- Use ONLY the retrieved context. If the answer isn't there, say "${notFound}".
- Cite passages inline using [1], [2], ... matching the numbered context items.
${miniRagLanguageInstruction(locale)}
- Be concise. Quote short phrases from the source when helpful.`;
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

  if (query.trim()) {
    try {
      const queryEmbedding = await embedOne(query);
      const similarity = sql<number>`1 - (${cosineDistance(
        playgroundDocuments.embedding,
        queryEmbedding
      )})`;

      const rows = await db
        .select({
          id: playgroundDocuments.id,
          chunkIndex: playgroundDocuments.chunkIndex,
          content: playgroundDocuments.content,
          similarity,
        })
        .from(playgroundDocuments)
        .where(
          and(
            eq(playgroundDocuments.sessionId, sessionId),
            gt(similarity, 0.2)
          )
        )
        .orderBy(desc(similarity))
        .limit(6);

      if (rows.length > 0) {
        context = rows
          .map((r, i) => `[${i + 1}] ${r.content.trim()}`)
          .join("\n\n");
        sources = rows.map((r, i) => ({
          id: i + 1,
          chunkIndex: r.chunkIndex,
          preview: r.content.slice(0, 120) + (r.content.length > 120 ? "…" : ""),
        }));
      }
    } catch (err) {
      console.error("[mini-rag/chat] retrieval failed:", err);
    }
  }

  const result = streamText({
    model: chatModel(model),
    system: `${buildSystem(locale)}\n\n# Retrieved context from the PDF\n${context}`,
    messages,
    temperature: 0.2,
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
          return "Missing or invalid GROQ_API_KEY in .env.local.";
        }
        return error.message;
      }
      return "Stream failed.";
    },
  });
}
