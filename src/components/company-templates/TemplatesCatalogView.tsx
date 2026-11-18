"use client";

import Link from "next/link";
import { ArrowRight, Check, Eye, LayoutTemplate } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Container } from "@/components/ui/Container";
import { ScaledFrame } from "@/components/company-templates/ScaledFrame";
import { companyTemplates, type TemplateLayout } from "@/content/company-templates";
import type { TranslationKey } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const FILTERS: ("all" | TemplateLayout)[] = ["all", "corporate", "bold", "minimal"];

export function TemplatesCatalogView() {
  const { t, locale } = useLocale();
  const loc = locale === "id" ? "id" : "en";
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const items = companyTemplates.filter((tpl) => filter === "all" || tpl.layout === filter);

  return (
    <Container className="py-14">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-text">
        <LayoutTemplate className="h-3.5 w-3.5" /> {t("templates.badge")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t("templates.title")}</h1>
      <p className="mt-3 max-w-2xl text-foreground/65">{t("templates.subtitle")}</p>

      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/70">
        {(["templates.include.responsive", "templates.include.fast", "templates.include.whatsapp", "templates.include.custom"] as TranslationKey[]).map((k) => (
          <li key={k} className="inline-flex items-center gap-1.5">
            <Check className="h-4 w-4 text-primary-text" /> {t(k)}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-1 rounded-xl border border-foreground/10 p-1 text-sm sm:inline-flex">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-3 py-1.5 font-medium transition-colors",
              filter === f ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground"
            )}
          >
            {t(`templates.layout.${f}` as TranslationKey)}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((tpl) => (
          <article
            key={tpl.slug}
            className="group flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] transition-shadow hover:shadow-xl"
          >
            <Link href={`/templates/${tpl.slug}`} className="relative block border-b border-foreground/10 bg-white">
              <ScaledFrame src={`/templates/${tpl.slug}/view`} title={`${tpl.name} preview`} />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                  <Eye className="h-4 w-4" /> {t("templates.previewCta")}
                </span>
              </span>
            </Link>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{tpl.name}</h2>
                <span className="flex gap-1">
                  <span className="h-3 w-3 rounded-full" style={{ background: tpl.theme.primary }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: tpl.theme.accent }} />
                </span>
              </div>
              <p className="text-xs text-foreground/50">
                {tpl.industry[loc]} · {t(`templates.layout.${tpl.layout}` as TranslationKey)}
              </p>
              <p className="mt-3 flex-1 text-sm text-foreground/70">{tpl.summary[loc]}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {tpl.highlights.map((h) => (
                  <li key={h.en} className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] text-foreground/60">
                    {h[loc]}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex gap-2">
                <Link
                  href={`/templates/${tpl.slug}`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-foreground/15 px-3 py-2 text-sm font-medium hover:bg-foreground/5"
                >
                  <Eye className="h-4 w-4" /> {t("templates.previewCta")}
                </Link>
                <Link
                  href={`/contact?template=${tpl.slug}`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {t("templates.useCta")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Container>
  );
}
