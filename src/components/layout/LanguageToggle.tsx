"use client";

import { useLocale } from "@/components/layout/LocaleProvider";
import { FlagIcon } from "@/components/ui/FlagIcon";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const options: { value: Locale; labelKey: "lang.en" | "lang.id" }[] = [
  { value: "en", labelKey: "lang.en" },
  { value: "id", labelKey: "lang.id" },
];

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("lang.switch")}
      className="inline-flex rounded-md border border-foreground/15 p-0.5"
    >
      {options.map(({ value, labelKey }) => {
        const active = locale === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={t(labelKey)}
            title={t(labelKey)}
            onClick={() => setLocale(value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            <FlagIcon locale={value} className="h-2.5 w-3.5" />
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
}
