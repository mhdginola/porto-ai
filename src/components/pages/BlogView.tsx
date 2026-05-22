"use client";

import { useLocale } from "@/components/layout/LocaleProvider";
import { Container } from "@/components/ui/Container";

export function BlogView() {
  const { t } = useLocale();

  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("blog.title")}
      </h1>
      <p className="mt-3 max-w-xl text-foreground/70">{t("blog.subtitle")}</p>
    </Container>
  );
}
