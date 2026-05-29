export const PREVIEW_SECTIONS = new Set([
  "top",
  "about",
  "listings",
  "categories",
  "agents",
  "contact",
  "how-it-works",
  "testimonials",
  "areas",
  "blog",
]);

export type PreviewHash = {
  siteSlug: string | null;
  section: string | null;
  blogPostId: string | null;
  listingId: string | null;
};

const emptyHash = (): PreviewHash => ({
  siteSlug: null,
  section: null,
  blogPostId: null,
  listingId: null,
});

export function parsePreviewHash(hash?: string): PreviewHash {
  const raw = (hash ?? (typeof window !== "undefined" ? window.location.hash : ""))
    .replace(/^#/, "")
    .trim();

  if (!raw) return emptyHash();

  const parts = raw.split("/").filter(Boolean);

  if (parts.length >= 3 && parts[1] === "blog") {
    return {
      siteSlug: parts[0] || null,
      section: "blog",
      blogPostId: parts.slice(2).join("/") || null,
      listingId: null,
    };
  }

  if (parts.length >= 3 && parts[1] === "listing") {
    return {
      siteSlug: parts[0] || null,
      section: "listings",
      blogPostId: null,
      listingId: parts.slice(2).join("/") || null,
    };
  }

  if (parts.length === 2) {
    const [siteSlug, section] = parts;
    return {
      siteSlug: siteSlug || null,
      section: section && PREVIEW_SECTIONS.has(section) ? section : null,
      blogPostId: null,
      listingId: null,
    };
  }

  if (PREVIEW_SECTIONS.has(raw)) {
    return { siteSlug: null, section: raw, blogPostId: null, listingId: null };
  }

  return { siteSlug: raw, section: null, blogPostId: null, listingId: null };
}

export function scrollToPreviewSection(section: string) {
  const id = section === "top" ? "top" : section;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

let savedScrollY: number | null = null;

function scrollPreviewToY(y: number) {
  const html = document.documentElement;
  const body = document.body;
  const htmlPrev = html.style.scrollBehavior;
  const bodyPrev = body.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  body.style.scrollBehavior = "auto";
  window.scrollTo(0, y);
  html.scrollTop = y;
  body.scrollTop = y;
  html.style.scrollBehavior = htmlPrev;
  body.style.scrollBehavior = bodyPrev;
}

export function savePreviewScroll() {
  const { listingId, blogPostId } = parsePreviewHash();
  if (!listingId && !blogPostId) {
    savedScrollY = window.scrollY;
  }
}

export function restorePreviewScroll() {
  if (savedScrollY === null) return;
  const y = savedScrollY;
  savedScrollY = null;
  scrollPreviewToY(y);
}

export function scrollPreviewToTop() {
  scrollPreviewToY(0);
}

export function openBlogPostHash(siteSlug: string, postId: string) {
  savePreviewScroll();
  window.location.hash = `${siteSlug}/blog/${postId}`;
}

export function closeBlogPostHash(siteSlug: string) {
  window.location.hash = siteSlug;
}

export function openListingHash(siteSlug: string, listingId: string) {
  savePreviewScroll();
  window.location.hash = `${siteSlug}/listing/${listingId}`;
}

export function closeListingHash(siteSlug: string) {
  window.location.hash = siteSlug;
}

export function isPreviewModeHash(hash?: string): boolean {
  const { siteSlug, section, blogPostId, listingId } = parsePreviewHash(hash);
  return Boolean(siteSlug || section || blogPostId || listingId);
}
