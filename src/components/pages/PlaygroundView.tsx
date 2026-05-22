"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n/translations";

type Demo = {
  titleKey: TranslationKey;
  descKey: TranslationKey;
  href?: string;
  status: "live" | "soon";
};

const demos: Demo[] = [
  {
    titleKey: "playground.demo.summarizer.title",
    descKey: "playground.demo.summarizer.desc",
    href: "/playground/summarizer",
    status: "live",
  },
  {
    titleKey: "playground.demo.imageCode.title",
    descKey: "playground.demo.imageCode.desc",
    status: "soon",
  },
  {
    titleKey: "playground.demo.miniRag.title",
    descKey: "playground.demo.miniRag.desc",
    href: "/playground/mini-rag",
    status: "live",
  },
  {
    titleKey: "playground.demo.sentiment.title",
    descKey: "playground.demo.sentiment.desc",
    status: "soon",
  },
];

function DemoCard({
  demo,
  t,
}: {
  demo: Demo;
  t: (key: TranslationKey) => string;
}) {
  const isLive = demo.status === "live" && demo.href;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">{t(demo.titleKey)}</h3>
        {isLive ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary-text">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("playground.live")}
          </span>
        ) : (
          <Badge>{t("playground.comingSoon")}</Badge>
        )}
      </div>
      <p className="mt-2 text-sm text-foreground/60">{t(demo.descKey)}</p>
      {isLive && (
        <p className="mt-3 inline-flex items-center gap-1 text-xs text-primary-text">
          {t("playground.tryNow")} <ArrowUpRight className="h-3 w-3" />
        </p>
      )}
    </>
  );

  const baseClasses =
    "group rounded-xl border border-foreground/10 p-5 transition-colors";

  if (isLive && demo.href) {
    return (
      <Link href={demo.href} className={cn(baseClasses, "hover:bg-foreground/5")}>
        {content}
      </Link>
    );
  }

  return <div className={cn(baseClasses, "opacity-70")}>{content}</div>;
}

export function PlaygroundView() {
  const { t } = useLocale();

  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("playground.title")}
      </h1>
      <p className="mt-3 max-w-xl text-foreground/70">
        {t("playground.subtitle")}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {demos.map((d) => (
          <DemoCard key={d.titleKey} demo={d} t={t} />
        ))}
      </div>
    </Container>
  );
}
