"use client";

import { useCompletion } from "@ai-sdk/react";
import { AlertCircle, ArrowLeft, Check, Copy, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ActiveModelStatus } from "@/components/ai/ActiveModelStatus";
import { ModelPicker } from "@/components/ai/ModelPicker";
import { useLocale } from "@/components/layout/LocaleProvider";
import { useChatModel } from "@/hooks/useChatModel";
import { cn } from "@/lib/utils";

type Style = "bullet" | "paragraph" | "tldr";

const EXAMPLES: { labelKey: "summarizer.exampleEn" | "summarizer.exampleId"; text: string }[] = [
  {
    labelKey: "summarizer.exampleEn",
    text: `Anthropic released Claude 4.6 Opus today, claiming state-of-the-art performance on coding benchmarks. The model scores 84% on SWE-bench Verified, surpassing the previous leader by 6 points. Pricing is unchanged at $15 per million input tokens and $75 per million output tokens. Anthropic also introduced a new "extended thinking" mode that lets the model deliberate longer on hard problems, similar to OpenAI's o3 architecture. Early reviewers note significantly improved long-context reasoning across 200k tokens, with fewer hallucinations on complex codebases. The release positions Anthropic firmly against OpenAI in the coding-assistant race.`,
  },
  {
    labelKey: "summarizer.exampleId",
    text: `Pemerintah Indonesia resmi meluncurkan strategi nasional AI 2026-2030 yang menargetkan investasi 50 triliun rupiah selama lima tahun ke depan. Strategi ini mencakup tiga pilar utama: pengembangan talenta, infrastruktur komputasi nasional, dan ekosistem startup. Menteri Komunikasi dan Digital menyatakan akan ada 10 ribu beasiswa AI untuk lulusan SMA dan sarjana. Pemerintah juga akan membangun pusat data GPU berkapasitas 5000 H100 di Bandung dan Surabaya. Sektor swasta menyambut positif, dengan beberapa konglomerat berkomitmen co-investasi senilai 20 triliun rupiah.`,
  },
];

type Props = {
  defaultModelRef: string;
};

export function SummarizerView({ defaultModelRef }: Props) {
  const { locale, t } = useLocale();
  const [style, setStyle] = useState<Style>("bullet");
  const [copied, setCopied] = useState(false);
  const styles = useMemo(
    () =>
      [
        {
          id: "bullet" as const,
          label: t("summarizer.styleBullets"),
          description: t("summarizer.styleBulletsDesc"),
        },
        {
          id: "paragraph" as const,
          label: t("summarizer.styleParagraph"),
          description: t("summarizer.styleParagraphDesc"),
        },
        {
          id: "tldr" as const,
          label: t("summarizer.styleTldr"),
          description: t("summarizer.styleTldrDesc"),
        },
      ],
    [t]
  );
  const {
    modelRef,
    setModelRef,
    groups,
    confirmedModelRef,
    onModelFromResponse,
    activeProvider,
  } = useChatModel(defaultModelRef);

  const {
    completion,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useCompletion({
    api: "/api/summarize",
    body: { style, model: modelRef, locale },
    onResponse: onModelFromResponse,
  });

  const wordCount = useMemo(
    () => (input.trim() ? input.trim().split(/\s+/).length : 0),
    [input]
  );
  const charCount = input.length;
  const tooLong = charCount > 20_000;

  function loadExample(text: string) {
    setInput(text);
  }

  async function copyOutput() {
    if (!completion) return;
    await navigator.clipboard.writeText(completion);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
            {t("summarizer.title")}
          </h1>
          <p className="mt-2 max-w-xl text-foreground/70">
            {t("summarizer.subtitle")}
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
            loading={isLoading}
          />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-10 grid gap-4 lg:grid-cols-2"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="text-input"
              className="text-sm font-medium text-foreground/80"
            >
              {t("summarizer.yourText")}
            </label>
            <div className="flex gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.labelKey}
                  type="button"
                  onClick={() => loadExample(ex.text)}
                  className="rounded-md border border-foreground/10 px-2 py-1 text-xs text-foreground/70 transition-colors hover:bg-foreground/5"
                >
                  {t(ex.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="text-input"
            value={input}
            onChange={handleInputChange}
            placeholder={t("summarizer.placeholder")}
            rows={14}
            className={cn(
              "w-full resize-y rounded-lg border border-foreground/10 bg-transparent p-3 text-sm leading-relaxed outline-none transition-colors focus:border-foreground/30",
              tooLong && "border-red-500/50 focus:border-red-500/70"
            )}
          />

          <div className="flex items-center justify-between text-xs text-foreground/50">
            <span>
              {wordCount} {t("summarizer.wordsChars")} {charCount.toLocaleString()}{" "}
              {t("summarizer.chars")}
            </span>
            {tooLong && (
              <span className="text-red-500">{t("summarizer.tooLong")}</span>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              role="radiogroup"
              aria-label="Summary style"
              className="inline-flex rounded-lg border border-foreground/10 p-1"
            >
              {styles.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={style === s.id}
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs transition-colors",
                    style === s.id
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/60 hover:text-foreground"
                  )}
                  title={s.description}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !input.trim() || tooLong}
              className="w-full sm:w-auto"
            >
              <Wand2 className="h-4 w-4" />
              {isLoading ? t("summarizer.summarizing") : t("summarizer.summarize")}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground/80">
              {t("summarizer.summary")}
            </span>
            {completion && !isLoading && (
              <button
                type="button"
                onClick={copyOutput}
                className="inline-flex items-center gap-1.5 rounded-md border border-foreground/10 px-2 py-1 text-xs text-foreground/70 transition-colors hover:bg-foreground/5"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3" /> {t("common.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> {t("common.copy")}
                  </>
                )}
              </button>
            )}
          </div>

          <div
            className={cn(
              "min-h-[20rem] flex-1 rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4 text-sm leading-relaxed",
              !completion && "text-foreground/40"
            )}
          >
            {completion ? (
              <p className="whitespace-pre-wrap">{completion}</p>
            ) : isLoading ? (
              <p className="text-foreground/50">{t("common.thinking")}</p>
            ) : (
              <p>{t("summarizer.emptyHint")}</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>{error.message || t("summarizer.error")}</p>
              </div>
            </div>
          )}
        </div>
      </form>

      <p className="mt-10 text-xs text-foreground/50">
        Powered by Vercel AI SDK · provider:{" "}
        <code className="rounded bg-foreground/10 px-1 py-0.5">
          {activeProvider}
        </code>{" "}
        · source:{" "}
        <code className="rounded bg-foreground/10 px-1 py-0.5">
          src/app/api/summarize/route.ts
        </code>
        .
      </p>
    </Container>
  );
}
