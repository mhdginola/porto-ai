"use client";

import { useLayoutEffect, useRef } from "react";
import { AgencyNav } from "@/components/property-agency/site/AgencyNav";
import { BlogPostDetail } from "@/components/property-agency/site/BlogPostDetail";
import { ListingDetail } from "@/components/property-agency/site/ListingDetail";
import { SITE_LABELS } from "@/components/property-agency/site/labels";
import { SiteBody } from "@/components/property-agency/site/SiteBody";
import { SiteFooter } from "@/components/property-agency/site/SiteFooter";
import { getSiteAccent } from "@/components/property-agency/site/theme";
import { buildThemeStyleVars, normalizeHex } from "@/lib/property-agency/theme-color";
import type { PropertyAgencyConfig } from "@/lib/property-agency/schemas";
import {
  restorePreviewScroll,
  scrollPreviewToTop,
} from "@/lib/property-agency/preview-hash";

type Props = {
  name: string;
  config: PropertyAgencyConfig;
  locale?: "en" | "id";
  siteSlug?: string;
  blogPostId?: string | null;
  listingId?: string | null;
};

export function PropertyAgencySiteRenderer({
  name,
  config,
  locale = "en",
  siteSlug,
  blogPostId = null,
  listingId = null,
}: Props) {
  const customColor = config.theme?.customColor;
  const accent = getSiteAccent(config.theme?.accent, customColor);
  const themeStyle = normalizeHex(customColor)
    ? buildThemeStyleVars(customColor)
    : undefined;
  const labels = SITE_LABELS[locale];
  const blogPost =
    blogPostId && config.blogPosts
      ? config.blogPosts.find((p) => p.id === blogPostId)
      : null;
  const listing =
    listingId && config.listings
      ? config.listings.find((l) => l.id === listingId)
      : null;

  const isDetailView = Boolean(blogPostId || listingId);
  const wasDetailRef = useRef(false);

  useLayoutEffect(() => {
    const inDetail = Boolean(listingId || blogPostId);
    if (inDetail) {
      scrollPreviewToTop();
    } else if (wasDetailRef.current) {
      restorePreviewScroll();
    }
    wasDetailRef.current = inDetail;
  }, [listingId, blogPostId]);

  let mainContent = (
    <SiteBody
      name={name}
      config={config}
      accent={accent}
      labels={labels}
      locale={locale}
      siteSlug={siteSlug}
    />
  );

  if (listing && siteSlug) {
    mainContent = (
      <ListingDetail
        listing={listing}
        siteSlug={siteSlug}
        config={config}
        accent={accent}
        labels={labels}
        locale={locale}
      />
    );
  } else if (listingId && !listing) {
    mainContent = (
      <div className="mx-auto max-w-md px-6 py-20 text-center text-sm text-foreground/50">
        {labels.listingNotFound}
      </div>
    );
  } else if (blogPost && siteSlug) {
    mainContent = (
      <BlogPostDetail
        post={blogPost}
        siteSlug={siteSlug}
        accent={accent}
        labels={labels}
      />
    );
  } else if (blogPostId && !blogPost) {
    mainContent = (
      <div className="mx-auto max-w-md px-6 py-20 text-center text-sm text-foreground/50">
        {labels.blogNotFound}
      </div>
    );
  }

  return (
    <div
      id="top"
      className="min-h-screen bg-background text-foreground"
      style={themeStyle}
    >
      <AgencyNav
        name={name}
        logoUrl={config.theme?.logoUrl}
        accent={accent}
        phone={config.contact.phone}
        labels={labels}
      />
      {mainContent}
      {!isDetailView ? (
        <SiteFooter
          name={name}
          config={config}
          accent={accent}
          labels={labels}
        />
      ) : null}
    </div>
  );
}
