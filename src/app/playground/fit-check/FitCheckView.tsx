"use client";

import type { DeepPartial } from "ai";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Info,
  Sparkles,
  Target,
  TriangleAlert,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ActiveModelStatus } from "@/components/ai/ActiveModelStatus";
import { ModelPicker } from "@/components/ai/ModelPicker";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useChatModel } from "@/hooks/useChatModel";
import {
  fitCheckSchema,
  scoreToVerdict,
  VERDICT_STYLES,
  type FitCheckResult,
  type Verdict,
} from "@/lib/fit-check-schema";
import type { TranslationKey } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const MAX_CHARS = 8_000;

const EXAMPLES: { labelKey: TranslationKey; text: string }[] = [
  {
    labelKey: "fitCheck.exampleGoBackend",
    text: `Senior Backend Engineer (Go) — Fintech, Remote

We're hiring a senior Go engineer to own backend services for a regulated payments platform. You'll design clean, testable services, optimize PostgreSQL-heavy workloads, and ship to Kubernetes on GCP. Experience with compliance/AML systems and event-driven ETL is a strong plus. Bonus: exposure to blockchain settlement.

Requirements: 4+ years backend, Go + Gin, PostgreSQL, Docker/Kubernetes, clean architecture, CI/CD.`,
  },
  {
    labelKey: "fitCheck.exampleAiFullstack",
    text: `Full-Stack AI Engineer — Next.js + LLMs

Build AI-native product features: RAG pipelines, structured LLM outputs, and polished React UIs. Stack: Next.js, TypeScript, PostgreSQL + pgvector, Vercel AI SDK. You'll own features end to end, from embeddings/ingest to streaming UI. Nice to have: multi-provider model routing and i18n.

Requirements: 3+ years full-stack, strong TypeScript/React, hands-on RAG, comfort with Postgres.`,
  },
];

const VERDICT_KEYS: Record<Verdict, TranslationKey> = {
  strong: "fitCheck.verdict.strong",
  good: "fitCheck.verdict.good",
  partial: "fitCheck.verdict.partial",
  stretch: "fitCheck.verdict.stretch",
};

type Props = { defaultModelRef: string };

function ScoreBar({
  score,
  barClass,
  label,
}: {
  score?: number;
  barClass: string;
  label: string;
}) {
  const pct = Math.round(score ?? 0);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs text-foreground/50">
        <span>{label}</span>
        <span className="text-2xl font-semibold tracking-tight text-foreground">
          {score != null ? `${pct}` : "—"}
          <span className="text-sm text-foreground/40">/100</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barClass)}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

function ResultPanel({
  object,
  isLoading,
  t,
}: {
  object: DeepPartial<FitCheckResult> | undefined;
  isLoading: boolean;
  t: (key: TranslationKey) => string;
}) {
  const hasUsableContent = Boolean(
    object?.role?.title ||
      object?.matchScore != null ||
      object?.summary ||
      object?.strengths?.length
  );

  if (!object && !isLoading) {
    return (
      <div className="flex min-h-[26rem] flex-col items-center justify-center rounded-lg border border-dashed border-foreground/15 bg-foreground/[0.02] p-8 text-center text-sm text-foreground/45">
        <Target className="mb-3 h-8 w-8 opacity-40" />
        <p>{t("fitCheck.emptyHint")}</p>
      </div>
    );
  }

  // Streaming finished but the model returned nothing usable (e.g. a small
  // model echoed the JSON schema instead of filling it). Show a clear hint
  // instead of leaving the skeletons up forever.
  if (!isLoading && object && !hasUsableContent) {
    return (
      <div className="flex min-h-[26rem] flex-col items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center text-sm text-foreground/60">
        <TriangleAlert className="mb-1 h-7 w-7 text-amber-500/70" />
        <p>{t("fitCheck.unparseable")}</p>
      </div>
    );
  }

  const verdict: Verdict | undefined =
    object?.verdict && object.verdict in VERDICT_STYLES
      ? (object.verdict as Verdict)
      : object?.matchScore != null
        ? scoreToVerdict(object.matchScore)
        : undefined;
  const style = verdict ? VERDICT_STYLES[verdict] : VERDICT_STYLES.good;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            {object?.role?.title || t("fitCheck.matchScore")}
          </span>
          {verdict ? (
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                style.badge
              )}
            >
              {t(VERDICT_KEYS[verdict])}
            </span>
          ) : (
            <div className="h-6 w-20 animate-pulse rounded-full bg-foreground/10" />
          )}
        </div>
        <ScoreBar
          score={object?.matchScore}
          barClass={style.bar}
          label={t("fitCheck.matchScore")}
        />
        {object?.summary ? (
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            {object.summary}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-foreground/10" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-foreground/10" />
          </div>
        )}
      </div>

      {(object?.strengths?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{" "}
            {t("fitCheck.strengths")}
          </div>
          <ul className="mt-3 space-y-3">
            {object?.strengths?.map((s, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium text-foreground/90">{s?.point}</p>
                {s?.evidence && (
                  <p className="mt-0.5 text-foreground/60">{s.evidence}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(object?.gaps?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
            <TriangleAlert className="h-3.5 w-3.5 text-amber-500" />{" "}
            {t("fitCheck.gaps")}
          </div>
          <ul className="mt-3 space-y-3">
            {object?.gaps?.map((g, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium text-foreground/90">{g?.point}</p>
                {g?.mitigation && (
                  <p className="mt-0.5 text-foreground/60">{g.mitigation}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(object?.keyTech?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-foreground/10 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            {t("fitCheck.keyTech")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {object?.keyTech?.map((tech) => (
              <span
                key={tech}
                className="rounded-md border border-primary/25 bg-primary-soft px-2 py-0.5 text-xs text-primary-text"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {object?.pitch && (
        <div className="rounded-xl border border-primary/20 bg-primary-soft/40 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
            <Sparkles className="h-3.5 w-3.5 text-primary-text" />{" "}
            {t("fitCheck.pitch")}
          </div>
          <p className="mt-2 text-sm italic leading-relaxed text-foreground/80">
            {object.pitch}
          </p>
        </div>
      )}

      <p className="flex items-start gap-1.5 text-[11px] text-foreground/40">
        <Info className="mt-0.5 h-3 w-3 shrink-0" /> {t("fitCheck.disclaimer")}
      </p>
    </div>
  );
}

export function FitCheckView({ defaultModelRef }: Props) {
  const { locale, t } = useLocale();
  const [input, setInput] = useState("");
  const { modelRef, setModelRef, groups, confirmedModelRef } =
    useChatModel(defaultModelRef);

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/playground/fit-check",
    schema: fitCheckSchema,
    onError(err) {
      console.error("[fit-check]", err);
    },
  });

  const charCount = input.length;
  const tooLong = charCount > MAX_CHARS;
  const wordCount = useMemo(
    () => (input.trim() ? input.trim().split(/\s+/).length : 0),
    [input]
  );

  function analyze() {
    if (!input.trim() || tooLong) return;
    submit({ jobDescription: input, model: modelRef, locale });
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
            {t("fitCheck.title")}
          </h1>
          <p className="mt-2 max-w-xl text-foreground/70">
            {t("fitCheck.subtitle")}
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

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="fit-check-input"
              className="text-sm font-medium text-foreground/80"
            >
              {t("fitCheck.yourJd")}
            </label>
            <div className="flex flex-wrap justify-end gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.labelKey}
                  type="button"
                  onClick={() => setInput(ex.text)}
                  className="rounded-md border border-foreground/10 px-2 py-1 text-xs text-foreground/70 transition-colors hover:bg-foreground/5"
                >
                  {t(ex.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="fit-check-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("fitCheck.placeholder")}
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
            {tooLong && <span className="text-red-500">{t("fitCheck.tooLong")}</span>}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={analyze}
              disabled={isLoading || !input.trim() || tooLong}
              className="flex-1 sm:flex-none"
            >
              <Wand2 className="h-4 w-4" />
              {isLoading ? t("fitCheck.analyzing") : t("fitCheck.analyze")}
            </Button>
            {isLoading && (
              <Button type="button" variant="outline" onClick={() => stop()}>
                {t("fitCheck.stop")}
              </Button>
            )}
          </div>
        </div>

        <div>
          <ResultPanel object={object} isLoading={isLoading} t={t} />

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>{error.message || t("fitCheck.error")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
