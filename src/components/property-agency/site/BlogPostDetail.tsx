"use client";

import { ArrowLeft } from "lucide-react";
import type { SiteLabels } from "@/components/property-agency/site/labels";
import type { SiteAccent } from "@/components/property-agency/site/theme";
import type { BlogPost } from "@/lib/property-agency/schemas";
import { closeBlogPostHash } from "@/lib/property-agency/preview-hash";
import { cn } from "@/lib/utils";

type Props = {
  post: BlogPost;
  siteSlug: string;
  accent: SiteAccent;
  labels: SiteLabels;
};

export function BlogPostDetail({ post, siteSlug, accent, labels }: Props) {
  const body = (post.content?.trim() || post.excerpt).split(/\n{2,}/);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <button
        type="button"
        onClick={() => closeBlogPostHash(siteSlug)}
        className="inline-flex items-center gap-1.5 text-sm text-foreground/55 hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {labels.backToBlog}
      </button>

      {post.imageUrl ? (
        <div
          className="mt-6 h-52 rounded-2xl bg-cover bg-center sm:h-72"
          style={{ backgroundImage: `url(${post.imageUrl})` }}
        />
      ) : null}

      <div className="mt-8">
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            accent.text
          )}
        >
          {post.category}
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        {post.date ? (
          <p className="mt-3 text-sm text-foreground/45">{post.date}</p>
        ) : null}
      </div>

      <div className="mt-8 space-y-4 text-base leading-relaxed text-foreground/75">
        {body.map((paragraph, i) => (
          <p key={i}>{paragraph.trim()}</p>
        ))}
      </div>
    </article>
  );
}
