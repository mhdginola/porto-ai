"use client";

import type { DeepPartial } from "ai";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import {
  AlertCircle,
  ArrowLeft,
  Brain,
  Heart,
  Sparkles,
  Target,
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
import { type ChatProvider } from "@/lib/ai-models";
import {
  EMOTION_STYLES,
  INTENT_STYLES,
  sentimentSchema,
  type SentimentResult,
} from "@/lib/sentiment-schema";
import { cn } from "@/lib/utils";

const EXAMPLES: {
  labelKey: "sentiment.exampleComplaint" | "sentiment.examplePraise" | "sentiment.exampleSupport";
  text: string;
}[] = [
  {
    labelKey: "sentiment.exampleComplaint",
    text: "I've been waiting 3 weeks for a refund and nobody responds to my emails. This is unacceptable — I'm seriously considering switching providers.",
  },
  {
    labelKey: "sentiment.examplePraise",
    text: "Tim support kalian luar biasa! Masalah saya selesai dalam 10 menit dan penjelasannya sangat jelas. Terima kasih banyak 🙏",
  },
  {
    labelKey: "sentiment.exampleSupport",
    text: "Hi, I can't log in after the update. I tried resetting my password twice but still get error 403. Can someone help ASAP?",
  },
];

type Props = {
  provider: ChatProvider;
  defaultModel: string;
};

function ConfidenceBar({
  value,
  barClass,
  label,
}: {
  value?: number;
  barClass: string;
  label: string;
}) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-[10px] text-foreground/50">
        <span>{label}</span>
        <span>{value != null ? `${pct}%` : "—"}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barClass)}
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
  object: DeepPartial<SentimentResult> | undefined;
  isLoading: boolean;
  t: (key: import("@/lib/i18n/translations").TranslationKey) => string;
}) {
  const emotionPrimary =
    object?.emotion?.primary && object.emotion.primary in EMOTION_STYLES
      ? object.emotion.primary
      : undefined;
  const intentPrimary =
    object?.intent?.primary && object.intent.primary in INTENT_STYLES
      ? object.intent.primary
      : undefined;
  const emotionStyle = emotionPrimary
    ? EMOTION_STYLES[emotionPrimary]
    : EMOTION_STYLES.neutral;
  const intentStyle = intentPrimary
    ? INTENT_STYLES[intentPrimary]
    : INTENT_STYLES.other;

  if (!object && !isLoading) {
    return (
      <div className="flex min-h-[24rem] flex-col items-center justify-center rounded-lg border border-dashed border-foreground/15 bg-foreground/[0.02] p-8 text-center text-sm text-foreground/45">
        <Brain className="mb-3 h-8 w-8 opacity-40" />
        <p>{t("sentiment.emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
            <Heart className="h-3.5 w-3.5" /> {t("sentiment.emotion")}
          </div>
          {object?.emotion?.label ? (
            <span
              className={cn(
                "mt-3 inline-flex rounded-full border px-2.5 py-0.5 text-sm font-medium",
                emotionStyle.badge
              )}
            >
              {object.emotion.label}
            </span>
          ) : (
            <div className="mt-3 h-6 w-24 animate-pulse rounded-full bg-foreground/10" />
          )}
          {object?.emotion?.tone && (
            <p className="mt-2 text-sm text-foreground/70">{object.emotion.tone}</p>
          )}
          <ConfidenceBar
            value={object?.emotion?.confidence}
            barClass={emotionStyle.bar}
            label={t("sentiment.confidence")}
          />
        </div>

        <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground/50">
            <Target className="h-3.5 w-3.5" /> {t("sentiment.intent")}
          </div>
          {object?.intent?.label ? (
            <span
              className={cn(
                "mt-3 inline-flex rounded-full border px-2.5 py-0.5 text-sm font-medium",
                intentStyle.badge
              )}
            >
              {object.intent.label}
            </span>
          ) : (
            <div className="mt-3 h-6 w-24 animate-pulse rounded-full bg-foreground/10" />
          )}
          {object?.intent?.goal && (
            <p className="mt-2 text-sm text-foreground/70">{object.intent.goal}</p>
          )}
          <ConfidenceBar
            value={object?.intent?.confidence}
            barClass="bg-primary"
            label={t("sentiment.confidence")}
          />
        </div>
      </div>

      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
          {t("sentiment.summary")}
        </p>
        {object?.summary ? (
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            {object.summary}
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-foreground/10" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-foreground/10" />
          </div>
        )}
      </div>

      {(object?.keywords?.length ?? 0) > 0 || isLoading ? (
        <div className="rounded-xl border border-foreground/10 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            {t("sentiment.keywords")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {object?.keywords?.map((kw) => (
              <span
                key={kw}
                className="rounded-md border border-foreground/10 bg-foreground/5 px-2 py-0.5 text-xs text-foreground/70"
              >
                {kw}
              </span>
            ))}
            {isLoading &&
              !object?.keywords?.length &&
              [1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-6 w-16 animate-pulse rounded-md bg-foreground/10"
                />
              ))}
          </div>
        </div>
      ) : null}

      {isLoading && (
        <p className="text-center text-xs text-foreground/45 animate-pulse">
          {t("sentiment.analyzing")}
        </p>
      )}
    </div>
  );
}

export function SentimentView({ provider, defaultModel }: Props) {
  const { locale, t } = useLocale();
  const [input, setInput] = useState("");
  const { model, setModel, confirmedModelId } = useChatModel(
    provider,
    defaultModel
  );

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/sentiment",
    schema: sentimentSchema,
    onError(err) {
      console.error("[sentiment]", err);
    },
  });

  const charCount = input.length;
  const tooLong = charCount > 5_000;

  const wordCount = useMemo(
    () => (input.trim() ? input.trim().split(/\s+/).length : 0),
    [input]
  );

  function analyze() {
    if (!input.trim() || tooLong) return;
    submit({ prompt: input, model, locale });
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
            {t("sentiment.title")}
          </h1>
          <p className="mt-2 max-w-xl text-foreground/70">
            {t("sentiment.subtitle")}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <ModelPicker
              provider={provider}
              value={model}
              onChange={setModel}
              size="md"
              align="right"
            />
            <span className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-3 py-1 text-xs text-primary-text sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              {t("common.live")}
            </span>
          </div>
          <ActiveModelStatus
            provider={provider}
            selectedModelId={model}
            confirmedModelId={confirmedModelId}
            loading={isLoading}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="sentiment-input"
              className="text-sm font-medium text-foreground/80"
            >
              {t("sentiment.yourText")}
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
            id="sentiment-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("sentiment.placeholder")}
            rows={10}
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
              <span className="text-red-500">{t("sentiment.tooLong")}</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={analyze}
              disabled={isLoading || !input.trim() || tooLong}
              className="flex-1 sm:flex-none"
            >
              <Wand2 className="h-4 w-4" />
              {isLoading ? t("sentiment.analyzing") : t("sentiment.analyze")}
            </Button>
            {isLoading && (
              <Button type="button" variant="outline" onClick={() => stop()}>
                {t("sentiment.stop")}
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
                <p>{error.message || t("sentiment.error")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
