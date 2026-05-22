import { streamText } from "ai";
import { aiModelResponseHeaders, chatModel } from "@/lib/ai";
import { summarizeLanguageInstruction } from "@/lib/i18n/locale-prompt";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_INPUT_CHARS = 20_000;

const STYLE_BASE = {
  bullet:
    "Summarize the following text as 3 to 5 concise bullet points. Capture key facts, not opinions.",
  paragraph:
    "Summarize the following text in ONE short paragraph (max 80 words). Keep it neutral and dense.",
  tldr:
    "Summarize the following text as a single sharp TL;DR sentence (max 25 words).",
} as const;

type Style = keyof typeof STYLE_BASE;

function stylePrompt(style: Style, locale?: string) {
  return `${STYLE_BASE[style]} ${summarizeLanguageInstruction(locale)}`;
}

export async function POST(req: Request) {
  let body: { prompt?: string; style?: Style; model?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.prompt?.trim();
  const style: Style =
    body.style && body.style in STYLE_BASE ? body.style : "bullet";

  if (!text) {
    return Response.json({ error: "Missing text to summarize" }, { status: 400 });
  }

  if (text.length > MAX_INPUT_CHARS) {
    return Response.json(
      { error: `Text too long (max ${MAX_INPUT_CHARS} chars)` },
      { status: 413 }
    );
  }

  const result = streamText({
    model: chatModel(body.model),
    system: stylePrompt(style, body.locale),
    prompt: text,
    temperature: 0.3,
  });

  return result.toDataStreamResponse({
    headers: aiModelResponseHeaders(body.model),
    getErrorMessage: (error) => {
      console.error("[/api/summarize] stream error:", error);
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
