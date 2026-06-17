"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Container } from "@/components/ui/Container";
import { TechBadge } from "@/components/ui/TechBadge";
import type { BlogPost } from "@/content/blog";

export function BlogPostDetailView({ post }: { post: BlogPost }) {
  const { locale, t } = useLocale();
  const dateLocale = locale === "id" ? "id-ID" : "en-US";

  // Lightweight block renderer: "## " lines become headings, the rest paragraphs.
  const blocks = post.body.split(/\n\n+/);

  return (
    <Container className="py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("blog.backToBlog")}
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        {post.title}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-foreground/50">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(post.date).toLocaleDateString(dateLocale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {post.readMinutes} {t("blog.minRead")}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {post.tags.map((tag) => (
          <TechBadge key={tag} name={tag} />
        ))}
      </div>

      <article className="prose prose-neutral dark:prose-invert mt-10 max-w-2xl">
        {blocks.map((block, i) =>
          block.startsWith("## ") ? (
            <h2 key={i}>{block.replace(/^##\s+/, "")}</h2>
          ) : (
            <p key={i}>{block}</p>
          )
        )}
      </article>
    </Container>
  );
}
