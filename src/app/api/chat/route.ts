import { streamText, type Message } from "ai";
import { aiModelResponseHeaders, chatModel } from "@/lib/ai";
import { profile } from "@/content/profile";
import { chatLanguageInstruction } from "@/lib/i18n/locale-prompt";
import { formatChunksForPrompt, retrieveRelevantChunks } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 30;

function buildSystem(locale?: string) {
  return `You are the AI assistant on ${profile.name}'s portfolio website.

Goals:
- Answer questions about ${profile.name}'s skills, experience, and projects.
- Be concise, friendly, and recruiter-friendly.
${chatLanguageInstruction(locale)}
- Cite sources inline using the numbers from the context, e.g. [1] [2].
- If the answer is not in the retrieved context, say you don't have that info
  yet and suggest using the contact page.
- When context includes work experience (source: experience), summarize roles,
  companies, dates, and highlights from that context.
- When asked for full work history, list EVERY role in the context — do not skip
  current or recent positions (e.g. Portdex, PT Asta Protek Jiarsi).

Style: short paragraphs, plain prose, no marketing fluff.`;
}

export async function POST(req: Request) {
  const {
    messages,
    model,
    locale,
  }: { messages: Message[]; model?: string; locale?: string } =
    await req.json();

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const query =
    typeof lastUser?.content === "string" ? lastUser.content : undefined;

  let context = "(no relevant context retrieved)";
  let sources: Array<{ id: number; title: string; url: string | null }> = [];

  if (query && query.trim().length > 0) {
    try {
      const chunks = await retrieveRelevantChunks(query, { topK: 5 });
      context = formatChunksForPrompt(chunks);
      sources = chunks.map((c) => ({
        id: c.id,
        title: c.title,
        url: c.url,
      }));
    } catch (err) {
      console.error("RAG retrieval failed:", err);
    }
  }

  const system = `${buildSystem(locale)}\n\n# Retrieved context\n${context}`;

  const result = streamText({
    model: chatModel(model),
    system,
    messages,
    temperature: 0.3,
  });

  return result.toDataStreamResponse({
    headers: {
      "x-rag-sources": encodeURIComponent(JSON.stringify(sources)),
      ...aiModelResponseHeaders(model),
    },
    getErrorMessage: (error) => {
      console.error("[/api/chat] stream error:", error);
      if (error == null) return "Unknown error";
      if (typeof error === "string") return error;
      if (error instanceof Error) {
        if (/api[_ ]?key/i.test(error.message)) {
          return "Missing or invalid API key. Check GROQ_API_KEY in .env.local.";
        }
        return error.message;
      }
      return "Stream failed. Check server logs.";
    },
  });
}
