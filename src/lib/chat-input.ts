/**
 * Validation for chat-style AI endpoints (useChat payloads).
 *
 * - Only "user" and "assistant" roles: a client must never inject "system"
 *   (or tool) messages that override the server's instructions.
 * - Caps on message size, history length, and total characters bound the cost
 *   of every request.
 */
import { z } from "zod";
import type { Message } from "ai";

export const MAX_BODY_BYTES = 64 * 1024;
export const MAX_MESSAGE_CHARS = 4000;
export const MAX_HISTORY = 12;
export const MAX_TOTAL_CHARS = 16_000;
/** Upper bound on generated tokens per answer. */
export const MAX_OUTPUT_TOKENS = 2048;

const messageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(MAX_MESSAGE_CHARS),
  })
  // Keep SDK fields (id, parts, toolInvocations…) so multi-step tool history works.
  .passthrough();

const bodySchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(50),
    model: z.string().max(120).optional(),
    locale: z.string().max(10).optional(),
    sessionId: z.string().max(100).optional(),
  })
  .passthrough();

export type ChatBody = {
  messages: Message[];
  model?: string;
  locale?: string;
  sessionId?: string;
};

/** Keep the most recent turns that fit the budget; always ends with the latest message. */
function trimHistory(messages: Message[]): Message[] {
  const recent = messages.slice(-MAX_HISTORY);
  let total = 0;
  const kept: Message[] = [];
  for (let i = recent.length - 1; i >= 0; i--) {
    total += recent[i].content.length;
    if (total > MAX_TOTAL_CHARS && kept.length > 0) break;
    kept.unshift(recent[i]);
  }
  // Conversations should start with a user turn.
  while (kept.length > 1 && kept[0].role !== "user") kept.shift();
  return kept;
}

export async function parseChatBody(
  req: Request
): Promise<{ ok: true; body: ChatBody } | { ok: false; response: Response }> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: Response.json({ error: "Request too large" }, { status: 413 }),
    };
  }

  const raw = await req.text().catch(() => "");
  if (raw.length > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: Response.json({ error: "Request too large" }, { status: 413 }),
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      response: Response.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some(
      (i) => i.code === "too_big" && i.path.includes("content")
    );
    return {
      ok: false,
      response: Response.json(
        {
          error: tooLong
            ? `Message too long (max ${MAX_MESSAGE_CHARS} characters)`
            : "Invalid chat request",
        },
        { status: tooLong ? 413 : 400 }
      ),
    };
  }

  const { messages, model, locale, sessionId } = parsed.data;
  return {
    ok: true,
    body: {
      messages: trimHistory(messages as unknown as Message[]),
      model,
      locale,
      sessionId,
    },
  };
}
