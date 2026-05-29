"use client";

import { Building2, Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { scrollToPreviewSection } from "@/lib/property-agency/preview-hash";
import type { SiteLabels } from "@/components/property-agency/site/labels";
import type { SiteAccent } from "@/components/property-agency/site/theme";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  logoUrl?: string;
  accent: SiteAccent;
  phone?: string;
  labels: SiteLabels;
};

export function AgencyNav({ name, logoUrl, accent, phone, labels }: Props) {
  const [open, setOpen] = useState(false);
  const links = [
    { section: "top", label: labels.home },
    { section: "listings", label: labels.listings },
    { section: "about", label: labels.about },
    { section: "contact", label: labels.contact },
  ];

  function goToSection(section: string) {
    scrollToPreviewSection(section);
    setOpen(false);
  }

  const navLinkClass =
    "rounded-lg px-2.5 py-2 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground";

  return (
    <nav
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-xl",
        accent.nav
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <button
          type="button"
          onClick={() => goToSection("top")}
          className="flex min-w-0 items-center gap-2.5"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-9 w-auto max-w-[140px] shrink-0 object-contain object-left"
            />
          ) : (
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                accent.badge
              )}
            >
              <Building2 className="h-4 w-4" />
            </span>
          )}
          <span className="truncate font-semibold tracking-tight">{name}</span>
        </button>

        <ul className="hidden items-center gap-0.5 md:flex">
          {links.map((link) => (
            <li key={link.section}>
              <button
                type="button"
                onClick={() => goToSection(link.section)}
                className={navLinkClass}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className={cn(
                "hidden items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:inline-flex",
                accent.btn
              )}
            >
              <Phone className="h-4 w-4" />
              {labels.callUs}
            </a>
          ) : null}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/10 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-foreground/10 px-4 py-3 md:hidden">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.section}>
                <button
                  type="button"
                  onClick={() => goToSection(link.section)}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-foreground/75"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}
