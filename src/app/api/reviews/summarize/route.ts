import { streamObject } from "ai";
import { aiModelResponseHeaders, chatModel } from "@/lib/ai";
import { reviewSummaryLanguageInstruction } from "@/lib/i18n/review-prompt";
import { reviewSummarySchema } from "@/lib/review-summary-schema";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_INPUT_CHARS = 15_000;

const SYSTEM = `You summarize Google Maps place reputation for someone deciding whether to visit.

The user message contains a PLACE header plus one of these sources:
- Individual customer reviews with star ratings (best)
- Google's AI review summary for the place
- Google's editorial description + public place attributes + overall rating (limited — individual reviews unavailable)

Analyze the provided source material and return structured JSON:

1. placeName — use the exact place name from the PLACE header
2. verdict — one of: highly_recommended, worth_trying, mixed, caution, avoid
3. verdictLabel — short human-readable verdict (e.g. "Highly recommended", "Mixed — check before you go")
4. summary — 2–3 sentences on overall reputation (mention data limitations if source is editorial-only)
5. pros — up to 6 bullet points of positives (deduplicated themes)
6. cons — up to 6 bullet points of negatives or caveats (deduplicated themes; use "—" themes sparingly if data is thin)
7. commonThemes — up to 5 short tags (e.g. "slow service", "great coffee", "parking")
8. recommendation — one sentence practical advice for the reader

Rules:
- Base everything ONLY on the provided source — do not invent specific reviewer quotes or complaints.
- When only editorial description + rating is available, be honest that detailed review themes are limited.
- When individual reviews are provided, weight recent and detailed ones more when patterns conflict.
- Google Places API returns up to 5 individual reviews when available.
- Ignore spam or obvious fake patterns if present.

Output: return ONLY raw JSON matching the schema. Do NOT wrap in markdown code fences.`;

export async function POST(req: Request) {
  let body: { prompt?: string; model?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = body.prompt?.trim();
  if (!text) {
    return Response.json(
      { error: "Missing reviews to summarize" },
      { status: 400 },
    );
  }

  if (text.length > MAX_INPUT_CHARS) {
    return Response.json(
      { error: `Text too long (max ${MAX_INPUT_CHARS} chars)` },
      { status: 413 },
    );
  }

  const result = streamObject({
    model: chatModel(body.model),
    schema: reviewSummarySchema,
    mode: "json",
    system: `${SYSTEM}\n\n${reviewSummaryLanguageInstruction(body.locale)}`,
    prompt: text,
    temperature: 0.25,
  });

  return result.toTextStreamResponse({
    headers: aiModelResponseHeaders(body.model),
  });
}
