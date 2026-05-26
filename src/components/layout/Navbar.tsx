"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { href: "/work", labelKey: "nav.work" },
  { href: "/playground", labelKey: "nav.playground" },
  { href: "/blog", labelKey: "nav.blog" },
  { href: "/contact", labelKey: "nav.contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-foreground/10 bg-background/70 backdrop-blur">
      <Container className="flex h-14 items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          {siteConfig.name.split(" ")[0]}
          <span className="text-primary-text">.dev</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-foreground/5",
                  active && "bg-foreground/5 font-medium"
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
