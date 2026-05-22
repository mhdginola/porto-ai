"use client";

import Link from "next/link";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { siteConfig } from "@/lib/site";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="mt-24 border-t border-foreground/10 py-10 text-sm text-foreground/60">
      <Container className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}. {t("footer.builtWith")}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href={siteConfig.links.github}
            aria-label="GitHub"
            className="hover:text-foreground"
          >
            <Github className="h-4 w-4" />
          </Link>
          <Link
            href={siteConfig.links.linkedin}
            aria-label="LinkedIn"
            className="hover:text-foreground"
          >
            <Linkedin className="h-4 w-4" />
          </Link>
          <Link
            href={siteConfig.links.twitter}
            aria-label="Twitter"
            className="hover:text-foreground"
          >
            <Twitter className="h-4 w-4" />
          </Link>
          <Link
            href={`mailto:${siteConfig.links.email}`}
            aria-label="Email"
            className="hover:text-foreground"
          >
            <Mail className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </footer>
  );
}
