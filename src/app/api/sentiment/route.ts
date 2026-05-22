import { streamObject } from "ai";
import { aiModelResponseHeaders, chatModel } from "@/lib/ai";
import { sentimentLanguageInstruction } from "@/lib/i18n/sentiment-prompt";
import { sentimentSchema } from "@/lib/sentiment-schema";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_INPUT_CHARS = 5_000;

const SYSTEM = `You are a sentiment and intent classifier for short-form text (reviews, messages, emails, chat).

Analyze the user's text and return structured JSON with:

1. emotion — how the writer feels
   - primary: one of joy, sadness, anger, fear, surprise, disgust, neutral, mixed, excitement
   - label: short human-readable emotion name
   - confidence: 0.0–1.0
   - tone: brief tone description (e.g. "frustrated but professional")

2. intent — what the writer wants to achieve
   - primary: one of question, complaint, praise, request, information, purchase, support, feedback, urgency, other
   - label: short human-readable intent name
   - confidence: 0.0–1.0
   - goal: one sentence on what they want

3. summary — one concise sentence combining emotion + intent

4. keywords — up to 6 significant words or short phrases from the text

Be nuanced: sarcasm, mixed feelings, and implicit intent matter. Base everything only on the provided text.

Output: return ONLY raw JSON matching the schema. Do NOT wrap in markdown code fences or backticks.`;

export async function POST(req: Request) {
  let body: { prompt?: string; model?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.prompt?.trim();
  if (!text) {
    return Response.json({ error: "Missing text to analyze" }, { status: 400 });
  }

  if (text.length > MAX_INPUT_CHARS) {
    return Response.json(
      { error: `Text too long (max ${MAX_INPUT_CHARS} chars)` },
      { status: 413 }
    );
  }

  const result = streamObject({
    model: chatModel(body.model),
    schema: sentimentSchema,
    mode: "json",
    system: `${SYSTEM}\n\n${sentimentLanguageInstruction(body.locale)}`,
    prompt: text,
    temperature: 0.2,
  });

  return result.toTextStreamResponse({
    headers: aiModelResponseHeaders(body.model),
  });
}
