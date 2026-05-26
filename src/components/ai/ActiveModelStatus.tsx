"use client";

import { useLocale } from "@/components/layout/LocaleProvider";
import { type ModelGroup } from "@/lib/ai-models";
import { findModelInGroups } from "@/lib/chat-model-ref";
import { cn } from "@/lib/utils";

type ActiveModelStatusProps = {
  modelRef: string;
  confirmedModelRef?: string | null;
  groups: ModelGroup[];
  loading?: boolean;
  className?: string;
};

const PROVIDER_LABEL = {
  groq: "Groq",
  openai: "OpenAI",
  ollama: "Ollama",
} as const;

export function ActiveModelStatus({
  modelRef,
  confirmedModelRef,
  groups,
  loading = false,
  className,
}: ActiveModelStatusProps) {
  const { t } = useLocale();
  const activeRef = confirmedModelRef ?? modelRef;
  const active = findModelInGroups(activeRef, groups);
  const mismatch =
    confirmedModelRef != null && confirmedModelRef !== modelRef;

  if (!active) return null;

  const providerName = PROVIDER_LABEL[active.provider];

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-1.5 text-[10px] text-foreground/55",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          loading
            ? "animate-pulse bg-amber-500"
            : "bg-primary-text shadow-[0_0_6px_var(--primary-text)]"
        )}
        aria-hidden
      />
      <span>
        {loading ? t("ai.generatingVia") : t("ai.active")} · {active.label} ·{" "}
        {providerName}
      </span>
      {mismatch && (
        <span className="text-amber-600 dark:text-amber-400">
          {t("ai.fallbackModel")}
        </span>
      )}
    </div>
  );
}
