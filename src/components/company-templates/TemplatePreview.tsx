"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/layout/LocaleProvider";
import type { CompanyTemplate } from "@/content/company-templates";
import type { TranslationKey } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

const DEVICES = [
  { id: "desktop", icon: Monitor, width: "100%" },
  { id: "tablet", icon: Tablet, width: "820px" },
  { id: "mobile", icon: Smartphone, width: "390px" },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

/** Full-screen live preview with a device switcher. */
export function TemplatePreview({ template }: { template: CompanyTemplate }) {
  const { t, locale } = useLocale();
  const loc = locale === "id" ? "id" : "en";
  const [device, setDevice] = useState<DeviceId>("desktop");

  // Shareable device links: /templates/<slug>?device=mobile
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("device");
    if (DEVICES.some((d) => d.id === requested)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the URL once after mount
      setDevice(requested as DeviceId);
    }
  }, []);

  function chooseDevice(id: DeviceId) {
    setDevice(id);
    const url = new URL(window.location.href);
    if (id === "desktop") url.searchParams.delete("device");
    else url.searchParams.set("device", id);
    window.history.replaceState(null, "", url);
  }
  const width = DEVICES.find((d) => d.id === device)!.width;
  const src = `/templates/${template.slug}/view`;

  return (
    <div className="flex h-screen flex-col bg-neutral-200 dark:bg-neutral-900">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-foreground/10 bg-background px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/templates"
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-sm text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("templates.back")}</span>
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{template.name}</p>
            <p className="hidden truncate text-[11px] text-foreground/50 sm:block">{template.industry[loc]}</p>
          </div>
        </div>

        <div className="hidden items-center gap-1 rounded-lg border border-foreground/10 p-0.5 md:flex" role="radiogroup">
          {DEVICES.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={device === id}
              aria-label={t(`templates.device.${id}` as TranslationKey)}
              title={t(`templates.device.${id}` as TranslationKey)}
              onClick={() => chooseDevice(id)}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                device === id ? "bg-foreground text-background" : "text-foreground/55 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1 rounded-md px-2 py-1.5 text-sm text-foreground/70 hover:bg-foreground/5 sm:inline-flex"
          >
            <ExternalLink className="h-4 w-4" /> {t("templates.openNewTab")}
          </a>
          <Link
            href={`/contact?template=${template.slug}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {t("templates.useCta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="flex flex-1 justify-center overflow-hidden p-0 md:p-4">
        <iframe
          key={template.slug}
          src={src}
          title={`${template.name} — live preview`}
          className={cn(
            "h-full border-0 bg-white transition-[width] duration-300",
            device !== "desktop" && "rounded-xl shadow-2xl ring-1 ring-black/10"
          )}
          style={{ width }}
        />
      </div>
    </div>
  );
}
