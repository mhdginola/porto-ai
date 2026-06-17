import { streamObject } from "ai";
import { aiModelResponseHeaders, chatModel } from "@/lib/ai";
import { buildCvSummary } from "@/lib/cv-context";
import { fitCheckLanguageInstruction } from "@/lib/i18n/fit-check-prompt";
import { fitCheckSchema } from "@/lib/fit-check-schema";
import { formatChunksForPrompt, retrieveRelevantChunks } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_INPUT_CHARS = 8_000;

const SYSTEM = `You are a hiring-fit analyst. Given a JOB DESCRIPTION and a CANDIDATE CV, assess how well the candidate fits the role and return structured JSON.

Rules:
- Ground EVERY strength in the CV context. Each strength's "evidence" must quote or paraphrase a specific role, project, or skill from the CV — never invent experience the candidate doesn't have.
- Be honest about gaps. If the role asks for something missing or thin in the CV, list it under "gaps" with a realistic "mitigation" (transferable experience, adjacent skills, or learnability). Do not oversell.
- matchScore (0–100) and verdict must reflect a fair read: strong (80+), good (60–79), partial (40–59), stretch (<40).
- "keyTech": technologies named in the job description that the candidate actually has.
- "pitch": 2–4 sentences, first-person-neutral ("Ginola brings…"), tailored to THIS role, suitable as a cover-letter opener. Confident but truthful.
- role.title / role.seniority: what you inferred the job is.

CRITICAL OUTPUT RULES:
- Return a JSON OBJECT INSTANCE filled with REAL values — NOT a JSON Schema.
- Your response MUST begin with the characters {"role": and contain actual data.
- NEVER output schema metadata: do not include the keys "type", "properties", "items", "required", "enum", or "$schema".
- Do NOT wrap the JSON in markdown code fences or backticks. Output raw JSON only.`;

export async function POST(req: Request) {
  let body: { jobDescription?: string; model?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const jd = body.jobDescription?.trim();
  if (!jd) {
    return Response.json(
      { error: "Missing job description" },
      { status: 400 }
    );
  }

  if (jd.length > MAX_INPUT_CHARS) {
    return Response.json(
      { error: `Job description too long (max ${MAX_INPUT_CHARS} chars)` },
      { status: 413 }
    );
  }

  const cv = buildCvSummary();

  // RAG augmentation — optional. If the DB/embeddings are unavailable the
  // feature still works on the static CV summary alone.
  let retrieved = "";
  try {
    const chunks = await retrieveRelevantChunks(jd, { topK: 6 });
    if (chunks.length > 0) {
      retrieved = `\n\nMOST RELEVANT CV EVIDENCE (retrieved for this role):\n${formatChunksForPrompt(chunks)}`;
    }
  } catch (err) {
    console.error("[fit-check] retrieval skipped:", err);
  }

  const result = streamObject({
    model: chatModel(body.model),
    schema: fitCheckSchema,
    mode: "json",
    system: `${SYSTEM}\n\n${fitCheckLanguageInstruction(body.locale)}`,
    prompt: `CANDIDATE CV:\n${cv}${retrieved}\n\nJOB DESCRIPTION:\n${jd}`,
    temperature: 0.2,
  });

  return result.toTextStreamResponse({
    headers: aiModelResponseHeaders(body.model),
  });
}
