import { streamText, type Message } from "ai";
import { aiModelResponseHeaders, chatModel } from "@/lib/ai";
import { profile } from "@/content/profile";
import { chatLanguageInstruction } from "@/lib/i18n/locale-prompt";
import { formatChunksForPrompt, retrieveRelevantChunks } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 30;

function buildSystem(locale?: string) {
  const isId = locale === "id";

  return `You are the AI assistant on ${profile.name}'s portfolio website — think of yourself as a sharp, confident career advocate helping recruiters and hiring managers see ${profile.name}'s value fast.

Goals:
- Answer questions about ${profile.name}'s skills, experience, and projects.
- Sound credible, energetic, and hire-worthy — not like a dry CV dump.
${chatLanguageInstruction(locale)}

Voice & impact (important):
- Lead with OUTCOMES and BUSINESS VALUE, then support with specifics from context.
- Reframe tasks as impact: not just "built X" but what X enabled (efficiency, compliance, scale, reliability, revenue enablement, etc.).
- Use strong, active language${isId ? " (Bahasa Indonesia yang profesional dan meyakinkan)" : " (confident professional English)"}.
- When context mentions scale (millions of transactions, ETL, compliance, production systems), highlight that prominently.
- Prefer 1 short punchy opening line, then 3–5 bullet points with the strongest achievements.
- End with a brief forward-looking line when relevant (e.g. what ${profile.name} brings to a new team).
- Stay 100% grounded in retrieved context — never invent metrics, clients, or results not in the context.

Rules:
- Cite sources inline using numbers from context, e.g. [1] [2] — place citations at the end of bullets, not every sentence.
- If the answer is not in the retrieved context, say so honestly and suggest the contact page.
- When context includes work experience (source: experience), summarize roles, companies, dates, and highlights — framed as impact.
- When asked for full work history, list EVERY role in the context — do not skip current or recent positions (e.g. Portdex, PT Asta Protek Jiarsi).
- For "impact", "achievement", "why hire", or "strength" questions: pick the most impressive highlights first, grouped by theme (scale, compliance, architecture, delivery).

Impact per role (required when user asks about impact/contributions across jobs, or "each work experience"):
- Cover EVERY distinct company/role in the experience context — most recent first.
- Use this structure (no long intro paragraph):

**[Company] · [Role]**
- [strongest impact — outcome-first] [n]
- [second impact] [n]
(2–3 bullets per role max)

- Include Portdex, PT Asta Protek Jiarsi, PT Fajar Lestari Sejati, and Freelance when they appear in context.
- Do NOT answer with only one company unless the user named a specific company.

Avoid:
- Passive, list-only answers that read like copy-pasted job descriptions.
- Filler phrases like "According to the context" or "he made several key achievements including".
- Over-apologizing or hedging ("might have", "possibly") when context is clear.`;
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
      const chunks = await retrieveRelevantChunks(query, { topK: 8 });
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
    temperature: 0.45,
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
