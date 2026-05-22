"use client";

import type { DeepPartial } from "ai";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  MapPin,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActiveModelStatus } from "@/components/ai/ActiveModelStatus";
import { ModelPicker } from "@/components/ai/ModelPicker";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useChatModel } from "@/hooks/useChatModel";
import { type ChatProvider } from "@/lib/ai-models";
import type { GooglePlaceMeta } from "@/lib/google-places";
import type { TranslationKey } from "@/lib/i18n/translations";
import {
  reviewSummarySchema,
  VERDICT_STYLES,
  type ReviewSummaryResult,
} from "@/lib/review-summary-schema";
import { cn } from "@/lib/utils";

const EXAMPLES: {
  labelKey: "reviews.exampleRestaurant" | "reviews.exampleCafe";
  text: string;
}[] = [
  { labelKey: "reviews.exampleRestaurant", text: "Hachi Grill Ampera Jakarta" },
  { labelKey: "reviews.exampleCafe", text: "Kopi Kenangan Senayan" },
];

const MAX_QUERY_CHARS = 120;

type Props = {
  provider: ChatProvider;
  defaultModel: string;
};

function BulletList({
  items,
  icon: Icon,
  empty,
}: {
  items?: string[];
  icon: typeof ThumbsUp;
  empty: string;
}) {
  if (!items?.length) {
    return <p className="text-sm text-foreground/40">{empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm text-foreground/75">
          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/40" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function GoogleMetaCard({
  meta,
  t,
}: {
  meta: GooglePlaceMeta;
  t: (key: TranslationKey) => string;
}) {
  const sourceKey =
    meta.dataSource === "reviews"
      ? "reviews.sourceReviews"
      : meta.dataSource === "review_summary"
        ? "reviews.sourceReviewSummary"
        : "reviews.sourceEditorial";

  return (
    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-3 text-sm">
      <p className="font-medium">{meta.name}</p>
      {meta.address ? (
        <p className="mt-1 text-xs text-foreground/55">{meta.address}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground/65">
        {meta.rating != null ? (
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {meta.rating}/5
            {meta.totalRatings != null ? ` (${meta.totalRatings.toLocaleString()})` : null}
          </span>
        ) : null}
        {meta.dataSource === "reviews" ? (
          <span>
            {meta.reviewCount}{" "}
            {meta.reviewCount === 1 ? t("reviews.reviewSingular") : t("reviews.reviewPlural")}
          </span>
        ) : null}
        {meta.mapsUrl ? (
          <a
            href={meta.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary-text hover:underline"
          >
            {t("reviews.viewOnMaps")}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-foreground/45">{t(sourceKey)}</p>
    </div>
  );
}

function ResultPanel({
  object,
  isLoading,
  t,
}: {
  object: DeepPartial<ReviewSummaryResult> | undefined;
  isLoading: boolean;
  t: (key: TranslationKey) => string;
}) {
  const verdict =
    object?.verdict && object.verdict in VERDICT_STYLES
      ? object.verdict
      : undefined;
  const style = verdict ? VERDICT_STYLES[verdict] : VERDICT_STYLES.mixed;

  if (!object && !isLoading) {
    return (
      <div className="flex min-h-[24rem] flex-col items-center justify-center rounded-lg border border-dashed border-foreground/15 bg-foreground/[0.02] p-8 text-center text-sm text-foreground/45">
        <Star className="mb-3 h-8 w-8 opacity-40" />
        <p>{t("reviews.emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
              {t("reviews.verdict")}
            </p>
            {object?.placeName ? (
              <p className="mt-1 flex items-center gap-1.5 text-base font-semibold">
                <MapPin className="h-4 w-4 text-primary-text" />
                {object.placeName}
              </p>
            ) : (
              <div className="mt-2 h-5 w-40 animate-pulse rounded bg-foreground/10" />
            )}
          </div>
          {object?.verdictLabel ? (
            <span
              className={cn(
                "inline-flex rounded-full border px-3 py-1 text-sm font-medium",
                style.badge
              )}
            >
              {object.verdictLabel}
            </span>
          ) : (
            <div className="h-8 w-32 animate-pulse rounded-full bg-foreground/10" />
          )}
        </div>
        {object?.summary ? (
          <p className="mt-3 text-sm leading-relaxed text-foreground/75">
            {object.summary}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-foreground/10" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-foreground/10" />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-foreground/10 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            <ThumbsUp className="h-3.5 w-3.5" /> {t("reviews.pros")}
          </p>
          <BulletList
            items={object?.pros as string[] | undefined}
            icon={ThumbsUp}
            empty={isLoading ? "…" : "—"}
          />
        </div>
        <div className="rounded-xl border border-foreground/10 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
            <ThumbsDown className="h-3.5 w-3.5" /> {t("reviews.cons")}
          </p>
          <BulletList
            items={object?.cons as string[] | undefined}
            icon={ThumbsDown}
            empty={isLoading ? "…" : "—"}
          />
        </div>
      </div>

      {(object?.commonThemes?.length ?? 0) > 0 || isLoading ? (
        <div className="rounded-xl border border-foreground/10 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            {t("reviews.themes")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {object?.commonThemes?.map((theme) => (
              <span
                key={theme}
                className="rounded-md border border-foreground/10 bg-foreground/5 px-2 py-0.5 text-xs text-foreground/70"
              >
                {theme}
              </span>
            ))}
            {isLoading &&
              !object?.commonThemes?.length &&
              [1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-6 w-20 animate-pulse rounded-md bg-foreground/10"
                />
              ))}
          </div>
        </div>
      ) : null}

      {object?.recommendation ? (
        <div className="rounded-xl border border-primary/20 bg-primary-soft/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-text">
            {t("reviews.recommendation")}
          </p>
          <p className="mt-2 text-sm text-foreground/80">
            {object.recommendation}
          </p>
        </div>
      ) : isLoading ? (
        <div className="h-16 animate-pulse rounded-xl bg-foreground/5" />
      ) : null}

      {isLoading && (
        <p className="text-center text-xs text-foreground/45 animate-pulse">
          {t("reviews.analyzing")}
        </p>
      )}
    </div>
  );
}

export function ReviewSummarizerView({ provider, defaultModel }: Props) {
  const { locale, t } = useLocale();
  const [input, setInput] = useState("");
  const [placeMeta, setPlaceMeta] = useState<GooglePlaceMeta | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { model, setModel, confirmedModelId } = useChatModel(
    provider,
    defaultModel
  );

  const { object, submit, isLoading, error, stop } = useObject({
    api: "/api/reviews/summarize",
    schema: reviewSummarySchema,
  });

  const charCount = input.length;
  const tooLong = charCount > MAX_QUERY_CHARS;
  const busy = isLookingUp || isLoading;

  async function analyze() {
    const query = input.trim();
    if (!query || tooLong) return;

    setLookupError(null);
    setPlaceMeta(null);
    setIsLookingUp(true);

    try {
      const res = await fetch("/api/reviews/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, locale }),
      });

      const data = (await res.json()) as {
        error?: string;
        meta?: GooglePlaceMeta;
        reviewsText?: string;
      };

      if (!res.ok || !data.reviewsText || !data.meta) {
        setLookupError(data.error || t("reviews.error"));
        return;
      }

      setPlaceMeta(data.meta);
      submit({ prompt: data.reviewsText, model, locale });
    } catch {
      setLookupError(t("reviews.error"));
    } finally {
      setIsLookingUp(false);
    }
  }

  function handleStop() {
    stop();
    setIsLookingUp(false);
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
            {t("reviews.title")}
          </h1>
          <p className="mt-2 max-w-xl text-foreground/70">
            {t("reviews.subtitle")}
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
            loading={busy}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="place-input"
              className="text-sm font-medium text-foreground/80"
            >
              {t("reviews.placeName")}
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

          <input
            id="place-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !busy && input.trim() && !tooLong) {
                e.preventDefault();
                void analyze();
              }
            }}
            placeholder={t("reviews.placeholder")}
            className={cn(
              "w-full rounded-lg border border-foreground/10 bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-foreground/30",
              tooLong && "border-red-500/50 focus:border-red-500/70"
            )}
          />

          <div className="flex items-center justify-between text-xs text-foreground/50">
            <span>
              {charCount}/{MAX_QUERY_CHARS} {t("summarizer.chars")}
            </span>
            {tooLong && (
              <span className="text-red-500">{t("reviews.tooLong")}</span>
            )}
          </div>

          <p className="text-xs text-foreground/45">{t("reviews.hint")}</p>

          {placeMeta ? <GoogleMetaCard meta={placeMeta} t={t} /> : null}

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => void analyze()}
              disabled={busy || !input.trim() || tooLong}
              className="flex-1 sm:flex-none"
            >
              <Wand2 className="h-4 w-4" />
              {isLookingUp
                ? t("reviews.fetching")
                : isLoading
                  ? t("reviews.analyzing")
                  : t("reviews.analyze")}
            </Button>
            {busy && (
              <Button type="button" variant="outline" onClick={handleStop}>
                {t("sentiment.stop")}
              </Button>
            )}
          </div>

          {lookupError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>{lookupError}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <ResultPanel object={object} isLoading={isLoading} t={t} />

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>{error.message || t("reviews.error")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
