"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { buttonVariants } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/lib/site";
import { profile } from "@/content/profile";
import { allProjects } from "@/content/projects";

export function Hero() {
  const { t } = useLocale();

  const techCount = Object.values(profile.skills).flat().length;
  const stats = [
    { value: `${profile.yearsOfExperience}+`, label: t("about.yearsExperience") },
    { value: `${allProjects.length}+`, label: t("hero.statProjects") },
    { value: `${techCount}+`, label: t("hero.statTech") },
  ];

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid-fade absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--primary-soft),transparent_60%)]" />
      </div>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start gap-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-soft px-3 py-1 text-xs font-medium text-primary-text">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-primary" />
            </span>
            {t("hero.badge")}
          </span>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            <span className="text-gradient">
              {t("hero.titlePrefix")} {siteConfig.name}.
            </span>
            <br />
            <span className="text-foreground/55">
              {t("hero.titleLine2")}{" "}
              <span className="text-primary-text">{t("hero.titleHighlight")}</span>{" "}
              {t("hero.titleLine2Rest")}
            </span>
          </h1>

          <p className="max-w-xl text-foreground/70">
            {t("hero.description")} {t("hero.ctaHint")}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/projects" className={buttonVariants({ size: "lg" })}>
              {t("hero.ctaProjects")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              {t("hero.ctaContact")}
            </Link>
          </div>

          <dl className="mt-4 flex flex-wrap gap-x-10 gap-y-4 border-t border-foreground/10 pt-6">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {s.value}
                </dt>
                <dd className="text-xs text-foreground/55">{s.label}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </Container>
    </section>
  );
}
