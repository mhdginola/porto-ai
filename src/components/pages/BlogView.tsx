"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { Container } from "@/components/ui/Container";
import { TechBadge } from "@/components/ui/TechBadge";
import { getSortedBlogPosts } from "@/content/blog";

export function BlogView() {
  const { locale, t } = useLocale();
  const posts = getSortedBlogPosts();
  const dateLocale = locale === "id" ? "id-ID" : "en-US";

  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {t("blog.title")}
      </h1>
      <p className="mt-3 max-w-xl text-foreground/70">{t("blog.subtitle")}</p>

      {posts.length === 0 ? (
        <p className="mt-10 text-sm text-foreground/50">{t("blog.empty")}</p>
      ) : (
        <div className="mt-10 grid gap-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col gap-3 rounded-xl border border-foreground/10 p-5 transition-colors hover:bg-foreground/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {post.title}
                  </h2>
                  <p className="mt-1 text-sm text-foreground/60">
                    {post.summary}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-text" />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-foreground/50">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(post.date).toLocaleDateString(dateLocale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readMinutes} {t("blog.minRead")}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <TechBadge key={tag} name={tag} />
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
