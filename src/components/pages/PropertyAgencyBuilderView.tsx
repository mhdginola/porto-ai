"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTheme } from "@teispace/next-themes";
import "sweetalert2/dist/sweetalert2.min.css";
import { useLocale } from "@/components/layout/LocaleProvider";
import { usePropertyAgencyPreview } from "@/components/layout/PropertyAgencyPreviewProvider";
import { PropertyAgencySiteRenderer } from "@/components/pages/PropertyAgencySiteRenderer";
import { PropertyAgencyConfigEditor } from "@/components/property-agency/PropertyAgencyConfigEditor";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { alertDialog, confirmDialog } from "@/lib/confirm-dialog";
import type { PropertyAgencySite } from "@/lib/db/schema";
import type {
  PropertyAgencyConfig,
  PropertyListing,
} from "@/lib/property-agency/schemas";
import { slugifyName } from "@/lib/property-agency/slug";
import {
  parsePreviewHash,
  scrollToPreviewSection,
} from "@/lib/property-agency/preview-hash";
import { cn } from "@/lib/utils";

type SiteSummary = Pick<
  PropertyAgencySite,
  "id" | "slug" | "name" | "isPublished" | "updatedAt"
>;

type SiteFull = SiteSummary & { config: PropertyAgencyConfig };

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-xs font-medium text-foreground/55">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm outline-none focus:border-primary/50";

export function PropertyAgencyBuilderView() {
  const { t, locale } = useLocale();
  const { resolvedTheme } = useTheme();
  const { setPreviewActive } = usePropertyAgencyPreview();
  const loc = locale === "id" ? "id" : "en";
  const isDark = resolvedTheme === "dark";

  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [blogPostId, setBlogPostId] = useState<string | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [hashReady, setHashReady] = useState(false);
  const [previewSite, setPreviewSite] = useState<SiteFull | null>(null);
  const previewSlugRef = useRef<string | null>(null);
  const previewSiteRef = useRef<SiteFull | null>(null);
  previewSlugRef.current = previewSlug;
  previewSiteRef.current = previewSite;
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<SiteFull | null>(null);

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);

  const applyHash = useCallback(() => {
    const {
      siteSlug,
      section,
      blogPostId: postId,
      listingId: propId,
    } = parsePreviewHash();

    setBlogPostId(postId);
    setListingId(propId);

    if (!siteSlug && !section && !postId && !propId) {
      setPreviewSlug(null);
      setPreviewActive(false);
      return;
    }

    setPreviewActive(true);

    if (siteSlug) {
      setPreviewSlug(siteSlug);
      return;
    }

    const slug = previewSlugRef.current;
    const site = previewSiteRef.current;
    if (section && slug && site) {
      scrollToPreviewSection(section);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${slug}`
      );
      return;
    }

    if (section && !slug) {
      setPreviewError(t("propertyAgency.siteNotFound"));
    }
  }, [setPreviewActive, t]);

  useLayoutEffect(() => {
    applyHash();
    setHashReady(true);
  }, [applyHash]);

  useEffect(() => {
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [applyHash]);

  useEffect(() => {
    if (!previewSite || !previewSlug) return;
    const { siteSlug, section } = parsePreviewHash();
    if (section && (!siteSlug || siteSlug === previewSlug)) {
      requestAnimationFrame(() => scrollToPreviewSection(section));
    }
  }, [previewSite, previewSlug]);

  const loadSites = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/projects/property-agency/sites");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setSites(data.sites ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDraft = useCallback(async (slug: string) => {
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/property-agency/sites/${slug}?manage=1`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load site");
      setDraft(data.site);
      setActiveSlug(slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load site");
    }
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    if (!previewSlug) {
      setPreviewSite(null);
      setPreviewError(null);
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    fetch(
      `/api/projects/property-agency/sites/${encodeURIComponent(previewSlug)}`
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Site not found");
        if (!cancelled) setPreviewSite(data.site);
      })
      .catch((e) => {
        if (!cancelled) {
          setPreviewSite(null);
          setPreviewError(
            e instanceof Error ? e.message : t("propertyAgency.siteNotFound")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [previewSlug, t]);

  function openPreview(slug: string) {
    window.location.hash = slug;
    setPreviewSlug(slug);
    setPreviewActive(true);
  }

  function closePreview() {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`
    );
    setPreviewSlug(null);
    setBlogPostId(null);
    setListingId(null);
    setPreviewSite(null);
    setPreviewError(null);
    setPreviewActive(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    const slug = (newSlug.trim() || slugifyName(name)).toLowerCase();
    if (!name || !slug) return;

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/property-agency/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      setNewName("");
      setNewSlug("");
      await loadSites();
      await loadDraft(data.site.slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/property-agency/sites/${draft.slug}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draft.name,
            config: draft.config,
            isPublished: draft.isPublished,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setDraft(data.site);
      await loadSites();
      await alertDialog({
        title: t("propertyAgency.saveSuccessTitle"),
        text: t("propertyAgency.saveSuccessText"),
        icon: "success",
        isDark,
        timer: 2200,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save";
      setError(message);
      await alertDialog({
        title: t("propertyAgency.saveErrorTitle"),
        text: message,
        icon: "error",
        isDark,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!draft) return;
    const ok = await confirmDialog({
      title: t("propertyAgency.confirmDeleteTitle"),
      text: t("propertyAgency.confirmDelete"),
      confirmText: t("propertyAgency.delete"),
      cancelText: t("propertyAgency.cancel"),
      isDark,
    });
    if (!ok) return;

    try {
      const res = await fetch(
        `/api/projects/property-agency/sites/${draft.slug}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setDraft(null);
      setActiveSlug(null);
      await loadSites();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  function patchConfig(patch: Partial<PropertyAgencyConfig>) {
    setDraft((prev) =>
      prev ? { ...prev, config: { ...prev.config, ...patch } } : prev
    );
  }

  function patchListing(id: string, patch: Partial<PropertyListing>) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        config: {
          ...prev.config,
          listings: (prev.config.listings ?? []).map((l) =>
            l.id === id ? { ...l, ...patch } : l
          ),
        },
      };
    });
  }

  function addListing() {
    setDraft((prev) => {
      if (!prev) return prev;
      const listing: PropertyListing = {
        id: crypto.randomUUID(),
        title: "New property",
        location: "City",
        price: 0,
        bedrooms: 2,
        bathrooms: 1,
        area: 60,
        landArea: 0,
        type: "Rumah",
        status: "sale",
        facilities: [],
        description: "",
        specifications: [],
        imageUrl: "",
        floorPlanUrl: "",
        galleryUrls: [],
      };
      return {
        ...prev,
        config: {
          ...prev.config,
          listings: [...(prev.config.listings ?? []), listing],
        },
      };
    });
  }

  function removeListing(id: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        config: {
          ...prev.config,
          listings: (prev.config.listings ?? []).filter((l) => l.id !== id),
        },
      };
    });
  }

  if (!hashReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-foreground/45">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (previewSlug) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-foreground/10 bg-background/90 px-4 py-2.5 backdrop-blur-md">
          <button
            type="button"
            onClick={closePreview}
            className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("propertyAgency.backToBuilder")}
          </button>
          <span className="truncate font-mono text-xs text-foreground/45">
            #{previewSlug}
          </span>
        </div>
        {previewLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center text-foreground/50">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : previewError ? (
          <div className="mx-auto max-w-md px-6 py-20 text-center">
            <p className="text-sm text-red-400">{previewError}</p>
            <Button type="button" className="mt-4" onClick={closePreview}>
              {t("propertyAgency.backToBuilder")}
            </Button>
          </div>
        ) : previewSite ? (
          <PropertyAgencySiteRenderer
            name={previewSite.name}
            config={previewSite.config}
            locale={loc}
            siteSlug={previewSlug}
            blogPostId={blogPostId}
            listingId={listingId}
          />
        ) : null}
      </div>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("projects.backToProjects")}
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary-text">
            {t("propertyAgency.badge")}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("propertyAgency.title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-foreground/60">
            {t("propertyAgency.subtitle")}
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-foreground/10 p-4">
            <h2 className="text-sm font-semibold">{t("propertyAgency.yourSites")}</h2>
            {loading ? (
              <p className="mt-3 text-sm text-foreground/45">
                {t("propertyAgency.loading")}
              </p>
            ) : sites.length === 0 ? (
              <p className="mt-3 text-sm text-foreground/45">
                {t("propertyAgency.noSites")}
              </p>
            ) : (
              <ul className="mt-3 space-y-1">
                {sites.map((site) => (
                  <li key={site.id}>
                    <button
                      type="button"
                      onClick={() => loadDraft(site.slug)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        activeSlug === site.slug
                          ? "bg-primary-soft text-primary-text"
                          : "text-foreground/70 hover:bg-foreground/5"
                      )}
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 truncate">{site.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-foreground/10 p-4"
          >
            <h2 className="text-sm font-semibold">{t("propertyAgency.newSite")}</h2>
            <Field label={t("propertyAgency.fieldName")} className="mt-3">
              <input
                className={inputClass}
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlug) setNewSlug(slugifyName(e.target.value));
                }}
                placeholder={t("propertyAgency.namePlaceholder")}
              />
            </Field>
            <Field label={t("propertyAgency.fieldSlug")} className="mt-3">
              <input
                className={cn(inputClass, "font-mono text-xs")}
                value={newSlug}
                onChange={(e) =>
                  setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
                placeholder="my-agency"
              />
            </Field>
            <p className="mt-2 text-[11px] text-foreground/40">
              {t("propertyAgency.slugHint")}
            </p>
            <Button type="submit" size="sm" className="mt-4 w-full" disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" /> {t("propertyAgency.create")}
                </>
              )}
            </Button>
          </form>
        </aside>

        <div className="min-w-0">
          {!draft ? (
            <div className="rounded-xl border border-dashed border-foreground/15 px-6 py-16 text-center text-sm text-foreground/45">
              {t("propertyAgency.selectSite")}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 py-3">
                <div>
                  <p className="font-semibold">{draft.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-foreground/45">
                    #{draft.slug}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openPreview(draft.slug)}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t("propertyAgency.preview")}
                  </Button>
                  <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> {t("propertyAgency.save")}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <PropertyAgencyConfigEditor
                draft={draft}
                t={t}
                inputClass={inputClass}
                patchConfig={patchConfig}
                patchListing={patchListing}
                addListing={addListing}
                removeListing={removeListing}
                setDraft={setDraft}
              />
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
