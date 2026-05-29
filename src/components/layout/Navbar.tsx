"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { useLocale } from "@/components/layout/LocaleProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { siteConfig } from "@/lib/site";
import type { TranslationKey } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/Container";

const navItems: { href: string; labelKey: TranslationKey }[] = [
  { href: "/", labelKey: "nav.home" },
  { href: "/about", labelKey: "nav.about" },
  { href: "/projects", labelKey: "nav.projects" },
  { href: "/projects/property-agency-builder", labelKey: "nav.websiteBuilder" },
  { href: "/work", labelKey: "nav.work" },
  { href: "/playground", labelKey: "nav.playground" },
  { href: "/blog", labelKey: "nav.blog" },
  { href: "/contact", labelKey: "nav.contact" },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/projects") {
    return (
      pathname.startsWith("/projects") &&
      !pathname.startsWith("/projects/property-agency-builder")
    );
  }
  return pathname.startsWith(href);
}

function navLinkClass(active: boolean) {
  return cn(
    "rounded-md px-3 py-2 text-sm transition-colors",
    active
      ? "border border-primary/40 bg-primary-soft font-semibold text-primary-text shadow-sm shadow-primary/15"
      : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-foreground/10 bg-background/70 backdrop-blur">
      <Container className="flex h-14 items-center justify-between gap-3">
        <Link href="/" className="shrink-0 font-semibold tracking-tight">
          {siteConfig.name.split(" ")[0]}
          <span className="text-primary-text">.dev</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(active)}
                aria-current={active ? "page" : undefined}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/10 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </Container>

      {open ? (
        <nav
          className="border-t border-foreground/10 bg-background/95 px-4 py-3 backdrop-blur md:hidden"
          aria-label={t("nav.mobileMenu")}
        >
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(navLinkClass(active), "block w-full")}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {t(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
