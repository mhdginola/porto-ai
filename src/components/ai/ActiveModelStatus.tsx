"use client";

import { useLocale } from "@/components/layout/LocaleProvider";
import { getModelById, type ChatProvider } from "@/lib/ai-models";
import { cn } from "@/lib/utils";

type ActiveModelStatusProps = {
  provider: ChatProvider;
  selectedModelId: string;
  confirmedModelId?: string | null;
  loading?: boolean;
  className?: string;
};

const PROVIDER_LABEL: Record<ChatProvider, string> = {
  groq: "Groq",
  openai: "OpenAI",
};

export function ActiveModelStatus({
  provider,
  selectedModelId,
  confirmedModelId,
  loading = false,
  className,
}: ActiveModelStatusProps) {
  const { t } = useLocale();
  const activeId = confirmedModelId ?? selectedModelId;
  const active = getModelById(provider, activeId);
  const mismatch =
    confirmedModelId != null && confirmedModelId !== selectedModelId;

  if (!active) return null;

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
        {PROVIDER_LABEL[provider]}
      </span>
      {mismatch && (
        <span className="text-amber-600 dark:text-amber-400">
          {t("ai.fallbackModel")}
        </span>
      )}
    </div>
  );
}
