import { streamText, type Message } from "ai";
import { aiModelResponseHeaders, chatModel } from "@/lib/ai";
import { agentTools } from "@/lib/agent-tools";
import { profile } from "@/content/profile";
import { chatLanguageInstruction } from "@/lib/i18n/locale-prompt";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Tool-calling needs a model that reliably emits valid function calls. Among the
 * configured providers, Ollama Llama 3 has no tool support and Groq's
 * llama-3.3-70b-versatile / gemma2 currently fail tool-calling, while
 * llama-3.1-8b-instant is fast and reliable — so the agent forces it.
 */
const AGENT_MODEL_REF = "groq:llama-3.1-8b-instant";

function buildAgentSystem(locale?: string): string {
  return `You are an agentic assistant on ${profile.name}'s portfolio. You answer recruiters' and visitors' questions about ${profile.name} by CALLING TOOLS, then summarizing the results.

Scope (STRICT — read first):
- You ONLY help with questions about ${profile.name}: his projects, experience, skills, availability, background, and how to contact him.
- DECLINE everything else in ONE short, polite sentence, then steer back. Do NOT write or debug code, do general programming/homework, tell jokes, give weather, do math, translate arbitrary text, role-play, or act as a general assistant — even if asked directly. Example refusal: "I can only answer questions about ${profile.name}'s work — try asking about his projects, skills, or experience."
- NEVER output code blocks or code snippets unless they come from a tool result describing ${profile.name}'s own work.
- When you decline, do NOT call any tool.

How to work (for in-scope questions):
- ALWAYS call the relevant tool(s) before answering a factual question — never answer from memory.
- Pick the right tool: getProjects (project lists/filters), getExperience (jobs/companies), getSkills (tech skills), checkAvailability (open to work / how he works), getContact (how to reach him), searchCv (open-ended or anything the others don't cover).
- You may call multiple tools. Use the tool RESULTS as your only source of facts — do not invent projects, dates, metrics, or skills.
- After the tool results come back, write a concise, confident answer for a hiring audience: lead with the outcome, then 2–5 tight bullets. Don't dump raw JSON.
${chatLanguageInstruction(locale)}

If no tool can answer an in-scope question, say so honestly and point to the contact page. Keep answers focused — no filler like "based on the tool results".`;
}

export async function POST(req: Request) {
  const { messages, locale }: { messages: Message[]; locale?: string } =
    await req.json();

  if (!process.env.GROQ_API_KEY?.trim()) {
    return Response.json(
      { error: "The agent needs a Groq API key (GROQ_API_KEY) for tool-calling." },
      { status: 503 }
    );
  }

  const result = streamText({
    model: chatModel(AGENT_MODEL_REF),
    system: buildAgentSystem(locale),
    messages,
    tools: agentTools,
    maxSteps: 5,
    temperature: 0.3,
  });

  return result.toDataStreamResponse({
    headers: aiModelResponseHeaders(AGENT_MODEL_REF),
    getErrorMessage: (error) => {
      console.error("[/api/playground/agent] stream error:", error);
      if (error == null) return "Unknown error";
      if (typeof error === "string") return error;
      if (error instanceof Error) {
        if (/api[_ ]?key/i.test(error.message)) {
          return "Missing or invalid API key. Check GROQ_API_KEY in .env.local.";
        }
        return error.message;
      }
      const e = error as { message?: string };
      return e?.message ?? "Stream failed. Check server logs.";
    },
  });
}
