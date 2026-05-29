"use client";

import { scrollToPreviewSection } from "@/lib/property-agency/preview-hash";
import type { PropertyAgencyConfig } from "@/lib/property-agency/schemas";
import type { SiteLabels } from "@/components/property-agency/site/labels";
import type { SiteAccent } from "@/components/property-agency/site/theme";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  config: PropertyAgencyConfig;
  accent: SiteAccent;
  labels: SiteLabels;
};

export function SiteFooter({ name, config, accent, labels }: Props) {
  const footer = config.footer ?? {};
  const navLinks = [
    { section: "top", label: labels.home },
    { section: "listings", label: labels.listings },
    { section: "about", label: labels.about },
    { section: "contact", label: labels.contact },
  ];
  const socials = [
    { url: footer.facebook, label: "Facebook" },
    { url: footer.instagram, label: "Instagram" },
    { url: footer.linkedin, label: "LinkedIn" },
    { url: footer.youtube, label: "YouTube" },
  ].filter((s) => s.url);

  return (
    <footer className="border-t border-foreground/10 bg-foreground/[0.03] px-4 py-12 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="font-semibold">{name}</p>
          {footer.tagline ? (
            <p className="mt-2 text-sm leading-relaxed text-foreground/55">
              {footer.tagline}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
            {labels.footerNav}
          </p>
          <ul className="mt-3 space-y-2">
            {navLinks.map((link) => (
              <li key={link.section}>
                <button
                  type="button"
                  onClick={() => scrollToPreviewSection(link.section)}
                  className="text-sm text-foreground/60 hover:text-foreground"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
            {labels.footerLegal}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {footer.privacyUrl ? (
              <li>
                <a
                  href={footer.privacyUrl}
                  className="text-foreground/60 hover:text-foreground"
                >
                  {labels.privacy}
                </a>
              </li>
            ) : null}
            {footer.termsUrl ? (
              <li>
                <a
                  href={footer.termsUrl}
                  className="text-foreground/60 hover:text-foreground"
                >
                  {labels.terms}
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        {socials.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/45">
              {labels.footerSocial}
            </p>
            <ul className="mt-3 space-y-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("text-sm hover:underline", accent.text)}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <p className="mx-auto mt-10 max-w-6xl text-xs text-foreground/35">
        © {new Date().getFullYear()} {name}. {labels.footer}
      </p>
    </footer>
  );
}
