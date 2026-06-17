"use client";

import { useChat } from "@ai-sdk/react";
import { AlertCircle, ArrowLeft, Send, Sparkles, Wrench } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { TOOL_META, type AgentToolName } from "@/lib/agent-tools-meta";
import type { TranslationKey } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const AGENT_MODEL_LABEL = "Groq · Llama 3.1 8B";

function formatArgs(args: unknown): string {
  if (!args || typeof args !== "object") return "";
  const entries = Object.entries(args as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== "" && v !== null
  );
  if (entries.length === 0) return "";
  return entries
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(", ");
}

function ToolChip({
  name,
  args,
  done,
}: {
  name: string;
  args: unknown;
  done: boolean;
}) {
  const meta = TOOL_META[name as AgentToolName];
  const label = meta?.label ?? name;
  const argText = formatArgs(args);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
        done
          ? "border-primary/30 bg-primary-soft text-primary-text"
          : "border-foreground/15 bg-foreground/5 text-foreground/60"
      )}
    >
      {done ? (
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      ) : (
        <Wrench className="h-3 w-3 animate-pulse" />
      )}
      <span className="font-medium">{label}</span>
      {argText && <span className="text-foreground/45">({argText})</span>}
    </span>
  );
}

export function AgentView() {
  const { locale, t } = useLocale();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    status,
    error,
    stop,
  } = useChat({
    api: "/api/playground/agent",
    body: { locale },
  });

  const loading = status === "submitted" || status === "streaming";

  const examples: TranslationKey[] = [
    "agent.example1",
    "agent.example2",
    "agent.example3",
  ];

  return (
    <Container className="py-12">
      <Link
        href="/playground"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("common.backToPlayground")}
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("agent.title")}
          </h1>
          <p className="mt-2 max-w-xl text-foreground/70">{t("agent.subtitle")}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-3 py-1 text-xs text-primary-text">
            <Sparkles className="h-3.5 w-3.5" />
            {t("common.live")}
          </span>
          <span className="text-xs text-foreground/50">{AGENT_MODEL_LABEL}</span>
        </div>
      </div>

      <div className="mt-8 flex min-h-[28rem] flex-col rounded-xl border border-foreground/10">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
              <p className="max-w-md text-sm text-foreground/50">
                {t("agent.emptyHint")}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {examples.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => append({ role: "user", content: t(key) })}
                    className="rounded-full border border-foreground/10 px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-foreground/5"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                    {m.content}
                  </div>
                </div>
              );
            }

            const parts = m.parts ?? [];
            const toolParts = parts.filter((p) => p.type === "tool-invocation");
            const textParts = parts.filter((p) => p.type === "text");
            const text =
              textParts.map((p) => (p.type === "text" ? p.text : "")).join("") ||
              m.content;

            return (
              <div key={m.id} className="space-y-2">
                {toolParts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {toolParts.map((p, i) =>
                      p.type === "tool-invocation" ? (
                        <ToolChip
                          key={p.toolInvocation.toolCallId ?? i}
                          name={p.toolInvocation.toolName}
                          args={p.toolInvocation.args}
                          done={p.toolInvocation.state === "result"}
                        />
                      ) : null
                    )}
                  </div>
                )}
                {text && (
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-foreground/5 px-3 py-2 text-sm">
                    {text}
                  </div>
                )}
              </div>
            );
          })}

          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="inline-block rounded-lg bg-foreground/5 px-3 py-2 text-sm text-foreground/60">
              {t("agent.thinking")}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>{error.message || t("agent.error")}</p>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 border-t border-foreground/10 p-3"
        >
          <input
            value={input}
            onChange={handleInputChange}
            placeholder={t("agent.placeholder")}
            className="flex-1 rounded-md border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/30"
          />
          {loading ? (
            <Button type="button" variant="outline" onClick={() => stop()}>
              {t("agent.stop")}
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </Container>
  );
}
