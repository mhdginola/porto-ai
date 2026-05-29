"use client";

import {
  ArrowLeft,
  Bath,
  BedDouble,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
} from "lucide-react";
import { useState } from "react";
import type { SiteLabels } from "@/components/property-agency/site/labels";
import type { SiteAccent } from "@/components/property-agency/site/theme";
import { formatIdr } from "@/lib/format-idr";
import type { PropertyAgencyConfig, PropertyListing } from "@/lib/property-agency/schemas";
import {
  closeListingHash,
  scrollToPreviewSection,
} from "@/lib/property-agency/preview-hash";
import { cn } from "@/lib/utils";

type Props = {
  listing: PropertyListing;
  siteSlug: string;
  config: PropertyAgencyConfig;
  accent: SiteAccent;
  labels: SiteLabels;
  locale: "en" | "id";
};

export function ListingDetail({
  listing,
  siteSlug,
  config,
  accent,
  labels,
  locale,
}: Props) {
  const photos = [
    listing.imageUrl,
    ...(listing.galleryUrls ?? []).filter(Boolean),
  ].filter(Boolean) as string[];

  const [activePhoto, setActivePhoto] = useState(0);
  const currentPhoto = photos[activePhoto] ?? null;

  const specs = (listing.specifications ?? []).filter(
    (s) => s.label.trim() && s.value.trim()
  );
  const description = listing.description?.trim();
  const paragraphs = description
    ? description.split(/\n{2,}/).map((p) => p.trim())
    : [];

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <button
        type="button"
        onClick={() => closeListingHash(siteSlug)}
        className="inline-flex items-center gap-1.5 text-sm text-foreground/55 hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {labels.backToListings}
      </button>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div
            className={cn(
              "flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/5 bg-cover bg-center text-6xl",
              currentPhoto && "text-transparent"
            )}
            style={
              currentPhoto ? { backgroundImage: `url(${currentPhoto})` } : undefined
            }
          >
            {!currentPhoto ? "🏠" : null}
          </div>
          {photos.length > 1 ? (
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {photos.map((url, i) => (
                <li key={url + i}>
                  <button
                    type="button"
                    onClick={() => setActivePhoto(i)}
                    className={cn(
                      "h-16 w-20 shrink-0 rounded-lg border bg-cover bg-center",
                      activePhoto === i
                        ? cn("ring-2", accent.ring)
                        : "border-foreground/15 opacity-70"
                    )}
                    style={{ backgroundImage: `url(${url})` }}
                    aria-label={`Photo ${i + 1}`}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase",
              accent.badge
            )}
          >
            {listing.type}
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {listing.title}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground/55">
            <MapPin className="h-4 w-4 shrink-0" />
            {listing.location}
          </p>
          <p className="mt-5 text-3xl font-bold tabular-nums">
            {formatIdr(listing.price, locale)}
          </p>

          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <li className={cn("rounded-xl border p-3 text-center", accent.card)}>
              <BedDouble className={cn("mx-auto h-4 w-4", accent.text)} />
              <p className="mt-1 text-sm font-semibold">{listing.bedrooms}</p>
              <p className="text-[10px] text-foreground/45">{labels.bed}</p>
            </li>
            <li className={cn("rounded-xl border p-3 text-center", accent.card)}>
              <Bath className={cn("mx-auto h-4 w-4", accent.text)} />
              <p className="mt-1 text-sm font-semibold">{listing.bathrooms}</p>
              <p className="text-[10px] text-foreground/45">{labels.bath}</p>
            </li>
            <li className={cn("rounded-xl border p-3 text-center", accent.card)}>
              <Maximize2 className={cn("mx-auto h-4 w-4", accent.text)} />
              <p className="mt-1 text-sm font-semibold">{listing.area}</p>
              <p className="text-[10px] text-foreground/45">m² {labels.buildingArea}</p>
            </li>
            {(listing.landArea ?? 0) > 0 ? (
              <li className={cn("rounded-xl border p-3 text-center", accent.card)}>
                <Maximize2 className={cn("mx-auto h-4 w-4", accent.text)} />
                <p className="mt-1 text-sm font-semibold">{listing.landArea}</p>
                <p className="text-[10px] text-foreground/45">m² {labels.landArea}</p>
              </li>
            ) : null}
          </ul>

          <div className="mt-6 flex flex-wrap gap-2">
            {config.contact.phone ? (
              <a
                href={`tel:${config.contact.phone.replace(/\s/g, "")}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold",
                  accent.btn
                )}
              >
                <Phone className="h-4 w-4" />
                {labels.callUs}
              </a>
            ) : null}
            {config.contact.whatsapp ? (
              <a
                href={`https://wa.me/${config.contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Halo, saya tertarik dengan ${listing.title}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold",
                  accent.btnOutline
                )}
              >
                <MessageCircle className="h-4 w-4" />
                {labels.whatsapp}
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => scrollToPreviewSection("contact")}
              className={cn(
                "inline-flex rounded-xl border px-4 py-2.5 text-sm font-semibold",
                accent.btnOutline
              )}
            >
              {labels.requestInfo}
            </button>
          </div>
        </div>
      </div>

      {paragraphs.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">{labels.descriptionTitle}</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/70">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      ) : null}

      {specs.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">{labels.specificationsTitle}</h2>
          <dl className="mt-4 divide-y divide-foreground/10 rounded-xl border border-foreground/10">
            {specs.map((spec) => (
              <div
                key={`${spec.label}-${spec.value}`}
                className="grid grid-cols-2 gap-4 px-4 py-3 text-sm sm:grid-cols-[200px_1fr]"
              >
                <dt className="text-foreground/50">{spec.label}</dt>
                <dd className="font-medium">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {(listing.facilities ?? []).length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">{labels.facilitiesTitle}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {(listing.facilities ?? []).map((f) => (
              <li
                key={f}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  accent.badge
                )}
              >
                {f}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {listing.floorPlanUrl ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">{labels.floorPlanTitle}</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-foreground/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={listing.floorPlanUrl}
              alt={labels.floorPlanTitle}
              className="w-full bg-foreground/5 object-contain"
            />
          </div>
        </section>
      ) : null}
    </article>
  );
}
