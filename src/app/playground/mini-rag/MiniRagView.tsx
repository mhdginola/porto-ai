"use client";

import { useChat } from "@ai-sdk/react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ActiveModelStatus } from "@/components/ai/ActiveModelStatus";
import { ModelPicker } from "@/components/ai/ModelPicker";
import { useLocale } from "@/components/layout/LocaleProvider";
import { useChatModel } from "@/hooks/useChatModel";
import { cn } from "@/lib/utils";

type UploadInfo = {
  sessionId: string;
  filename: string;
  chunks: number;
  pageCount: number;
  truncated: boolean;
  extractionMethod?: "text" | "ocr";
};

type Source = { id: number; chunkIndex: number; preview: string };

type Props = {
  defaultModelRef: string;
};

export function MiniRagView({ defaultModelRef }: Props) {
  const { locale, t } = useLocale();
  const [upload, setUpload] = useState<UploadInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const {
    modelRef,
    setModelRef,
    groups,
    activeProvider,
    confirmedModelRef,
    onModelFromResponse,
    ollamaConnected,
    groqAvailable,
  } = useChatModel(defaultModelRef);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    setMessages,
    error,
    reload,
  } = useChat({
    api: "/api/playground/rag/chat",
    body: { sessionId: upload?.sessionId, model: modelRef, locale },
    onResponse(res) {
      onModelFromResponse(res);
      const raw = res.headers.get("x-rag-sources");
      if (!raw) return;
      try {
        setSources(JSON.parse(decodeURIComponent(raw)) as Source[]);
      } catch {
        setSources([]);
      }
    },
  });

  const chatLoading = status === "submitted" || status === "streaming";

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError(null);
    setMessages([]);
    setSources([]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("locale", locale);

    try {
      const res = await fetch("/api/playground/rag/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        const hint =
          typeof data.hint === "string" ? ` ${data.hint}` : "";
        setUploadError((data.error ?? "Upload failed") + hint);
      } else {
        setUpload(data as UploadInfo);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Network error");
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setUpload(null);
    setUploadError(null);
    setMessages([]);
    setSources([]);
  }

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
            {t("miniRag.title")}
          </h1>
          <p className="mt-2 max-w-xl text-foreground/70">
            {t("miniRag.subtitle")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <ModelPicker
              value={modelRef}
              onChange={setModelRef}
              groups={groups}
              size="md"
              align="right"
            />
            <span className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-3 py-1 text-xs text-primary-text sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              {t("common.live")}
            </span>
          </div>
          <ActiveModelStatus
            modelRef={modelRef}
            confirmedModelRef={confirmedModelRef}
            groups={groups}
            loading={chatLoading}
          />
          {activeProvider === "ollama" && ollamaConnected === false && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400">
              {t("ai.ollamaOffline")}
            </p>
          )}
        </div>
      </div>

      {!upload ? (
        <div className="mt-10">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            disabled={uploading}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-16 text-center transition-colors",
              dragOver
                ? "border-primary bg-primary-soft"
                : "border-foreground/15 hover:border-foreground/30 hover:bg-foreground/[0.02]",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-foreground/60" />
                <p className="text-sm font-medium">{t("miniRag.parsing")}</p>
                <p className="text-xs text-foreground/50">
                  {t("miniRag.parsingHint")}
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-foreground/50" />
                <p className="text-sm font-medium">{t("miniRag.dropPdf")}</p>
                <p className="text-xs text-foreground/50">{t("miniRag.limits")}</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </button>

          {uploadError && (
            <p className="mt-3 text-sm text-red-500">{uploadError}</p>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: t("miniRag.step1Title"),
                desc: t("miniRag.step1Desc"),
              },
              {
                title: t("miniRag.step2Title"),
                desc: t("miniRag.step2Desc"),
              },
              {
                title: t("miniRag.step3Title"),
                desc: t("miniRag.step3Desc"),
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-xl border border-foreground/10 p-4 text-sm"
              >
                <p className="font-medium">{step.title}</p>
                <p className="mt-1 text-foreground/60">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10 grid min-w-0 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="shrink-0 rounded-lg bg-primary-soft p-2">
                  <FileText className="h-4 w-4 text-primary-text" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium leading-snug">
                    {upload.filename}
                  </p>
                  <p className="text-xs text-foreground/60">
                    <CheckCircle2 className="mr-1 inline h-3 w-3 text-primary-text" />
                    {upload.chunks} {t("miniRag.chunks")} · {upload.pageCount}{" "}
                    {t("miniRag.pages")} {t("miniRag.indexed")}
                    {upload.extractionMethod === "ocr" &&
                      ` · ${t("miniRag.indexedViaOcr")}`}
                    {upload.truncated && ` · ${t("miniRag.truncated")}`}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reset}
                className="shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5" /> {t("miniRag.newPdf")}
              </Button>
            </div>

            <div className="flex h-[28rem] flex-col rounded-xl border border-foreground/10">
              <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
                {messages.length === 0 && (
                  <div className="space-y-2 text-foreground/60">
                    <p>{t("miniRag.tryAsking")}</p>
                    <ul className="space-y-1 text-xs">
                      <li>• {t("miniRag.suggestion1")}</li>
                      <li>• {t("miniRag.suggestion2")}</li>
                      <li>• {t("miniRag.suggestion3")}</li>
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

                {chatLoading && (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2 text-foreground/60">
                    <Loader2 className="h-3 w-3 animate-spin" />{" "}
                    {t("common.thinking")}
                  </div>
                )}

                {error && !chatLoading && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{t("chat.errorTitle")}</p>
                        <p className="mt-1 opacity-90">{error.message}</p>
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
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex gap-2 border-t border-foreground/10 p-3"
              >
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder={t("miniRag.chatPlaceholder")}
                  className="flex-1 rounded-md border border-foreground/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/30"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={chatLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          <aside className="rounded-xl border border-foreground/10 p-4 text-xs">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground/80">
                {t("miniRag.retrievedSources")}
              </p>
              {sources.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSources([])}
                  className="text-foreground/40 hover:text-foreground"
                  aria-label="Clear sources"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {sources.length === 0 ? (
              <p className="mt-2 text-foreground/50">
                {t("miniRag.citationsHint")}
              </p>
            ) : (
              <ol className="mt-3 space-y-2">
                {sources.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg bg-foreground/[0.02] p-2"
                  >
                    <span className="text-primary-text">[{s.id}]</span>{" "}
                    <span className="text-foreground/40">
                      chunk #{s.chunkIndex}
                    </span>
                    <p className="mt-1 text-foreground/70">{s.preview}</p>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>
      )}

      <p className="mt-10 text-xs text-foreground/50">
        Architecture: <code className="rounded bg-foreground/10 px-1 py-0.5">unpdf</code>{" "}
        for parsing ·{" "}
        <code className="rounded bg-foreground/10 px-1 py-0.5">
          Ollama nomic-embed-text
        </code>{" "}
        for embeddings ·{" "}
        <code className="rounded bg-foreground/10 px-1 py-0.5">pgvector</code> for
        retrieval ·{" "}
        <code className="rounded bg-foreground/10 px-1 py-0.5">
          {activeProvider === "ollama"
            ? "Ollama"
            : activeProvider === "groq"
              ? "Groq"
              : "OpenAI"}
        </code>{" "}
        for generation. Per-session isolation via{" "}
        <code className="rounded bg-foreground/10 px-1 py-0.5">sessionId</code>.
      </p>
    </Container>
  );
}
