"use client";

import { useChat } from "@ai-sdk/react";
import { AlertCircle, Bot, Send, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActiveModelStatus } from "@/components/ai/ActiveModelStatus";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { ModelPicker } from "@/components/ai/ModelPicker";
import { useChatModel } from "@/hooks/useChatModel";
import { cn } from "@/lib/utils";

type Source = { id: number; title: string; url: string | null };

type ChatWidgetProps = {
  defaultModelRef: string;
};

export function ChatWidget({ defaultModelRef }: ChatWidgetProps) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const {
    modelRef,
    setModelRef,
    groups,
    confirmedModelRef,
    onModelFromResponse,
  } = useChatModel(defaultModelRef);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    reload,
  } = useChat({
    api: "/api/chat",
    body: { model: modelRef, locale },
    onResponse(res) {
      onModelFromResponse(res);
      const raw = res.headers.get("x-rag-sources");
      if (!raw) return;
      try {
        const parsed = JSON.parse(decodeURIComponent(raw)) as Source[];
        setSources(parsed);
      } catch {
        setSources([]);
      }
    },
  });

  const loading = status === "submitted" || status === "streaming";
  const errorMessage = error?.message;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("chat.openAssistant")}
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </button>

      <div
        className={cn(
          "fixed bottom-20 right-5 z-50 flex w-[92vw] max-w-sm flex-col rounded-xl border border-foreground/10 bg-background shadow-2xl transition-all",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        )}
        style={{ height: 540 }}
      >
        <div className="border-b border-foreground/10 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{t("chat.title")}</p>
              <p className="text-xs text-foreground/60">{t("chat.subtitle")}</p>
            </div>
            <ModelPicker
              value={modelRef}
              onChange={setModelRef}
              groups={groups}
              align="right"
            />
          </div>
          <ActiveModelStatus
            modelRef={modelRef}
            confirmedModelRef={confirmedModelRef}
            groups={groups}
            loading={loading}
            className="mt-2"
          />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
          {messages.length === 0 && (
            <div className="space-y-2 text-foreground/60">
              <p>{t("chat.tryAsking")}</p>
              <ul className="space-y-1 text-xs">
                <li>• {t("chat.suggestion1")}</li>
                <li>• {t("chat.suggestion2")}</li>
                <li>• {t("chat.suggestion3")}</li>
              </ul>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-foreground/5"
              )}
            >
              {m.content}
            </div>
          ))}

          {loading && (
            <div className="inline-block rounded-lg bg-foreground/5 px-3 py-2 text-foreground/60">
              {t("common.thinking")}
            </div>
          )}

          {errorMessage && !loading && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{t("chat.errorTitle")}</p>
                  <p className="mt-1 opacity-90">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => reload()}
                    className="mt-2 inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-red-500/10"
                  >
                    {t("common.retry")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !errorMessage && sources.length > 0 && (
            <div className="rounded-lg border border-foreground/10 bg-foreground/[0.03] p-3 text-xs">
              <p className="mb-1.5 font-medium text-foreground/70">
                {t("common.sources")}
              </p>
              <ol className="space-y-1">
                {sources.map((s, i) => (
                  <li key={s.id} className="text-foreground/60">
                    <span className="text-primary-text">[{i + 1}]</span>{" "}
                    {s.url ? (
                      <Link
                        href={s.url}
                        className="underline-offset-4 hover:underline"
                      >
                        {s.title}
                      </Link>
                    ) : (
                      s.title
                    )}
                  </li>
                ))}
              </ol>
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
            placeholder={t("chat.placeholder")}
            className="flex-1 rounded-md border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/30"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
