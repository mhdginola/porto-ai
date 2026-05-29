"use client";

import {
  Bath,
  BedDouble,
  Mail,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  Star,
} from "lucide-react";
import { useState } from "react";
import type { SiteLabels } from "@/components/property-agency/site/labels";
import type { SiteAccent } from "@/components/property-agency/site/theme";
import { formatIdr } from "@/lib/format-idr";
import type { PropertyAgencyConfig } from "@/lib/property-agency/schemas";
import { scrollToPreviewSection, openBlogPostHash, openListingHash } from "@/lib/property-agency/preview-hash";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  config: PropertyAgencyConfig;
  accent: SiteAccent;
  labels: SiteLabels;
  locale: "en" | "id";
  siteSlug?: string;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-foreground/20"
          )}
        />
      ))}
    </span>
  );
}

export function SiteBody({ name, config, accent, labels, locale, siteSlug }: Props) {
  const heroBg = config.hero.imageUrl
    ? { backgroundImage: `url(${config.hero.imageUrl})` }
    : undefined;

  const listings = config.listings ?? [];
  const [formSent, setFormSent] = useState(false);
  const ctaPrimary = config.hero.ctaPrimary || labels.viewProperties;
  const ctaSecondary = config.hero.ctaSecondary || labels.callUs;

  return (
    <>
      <header
        className={cn(
          "relative flex min-h-[48vh] flex-col justify-end bg-cover bg-center px-4 pb-12 pt-6 sm:px-8",
          !config.hero.imageUrl &&
            "bg-gradient-to-br from-foreground/10 to-background"
        )}
        style={heroBg}
      >
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t",
            accent.hero,
            config.hero.imageUrl ? "opacity-95" : "opacity-60"
          )}
        />
        <div className="relative mx-auto w-full max-w-6xl">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.25em]",
              accent.text
            )}
          >
            {name}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            {config.hero.title}
          </h1>
          {config.hero.subtitle ? (
            <p className="mt-4 max-w-2xl text-base text-foreground/75 sm:text-lg">
              {config.hero.subtitle}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => scrollToPreviewSection("listings")}
              className={cn(
                "inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors",
                accent.btn
              )}
            >
              {ctaPrimary}
            </button>
            <button
              type="button"
              onClick={() => scrollToPreviewSection("contact")}
              className={cn(
                "inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors",
                accent.btnOutline
              )}
            >
              {ctaSecondary}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        {config.categories && config.categories.length > 0 ? (
          <section id="categories" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight">
              {labels.categoriesTitle}
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {config.categories.map((cat) => (
                <li
                  key={cat.id}
                  className={cn(
                    "rounded-2xl border p-5 transition-shadow hover:shadow-md",
                    accent.card
                  )}
                >
                  <span className="text-2xl">{cat.icon || "🏠"}</span>
                  <h3 className="mt-3 font-semibold">{cat.label}</h3>
                  {cat.description ? (
                    <p className="mt-1 text-sm text-foreground/55">
                      {cat.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id="listings" className="scroll-mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {labels.featuredTitle}
            </h2>
            <span className="text-sm text-foreground/45">
              {listings.length} {labels.listingsCount}
            </span>
          </div>

          {listings.length > 0 ? (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <button
                    type="button"
                    disabled={!siteSlug}
                    onClick={() => {
                      if (siteSlug) openListingHash(siteSlug, listing.id);
                    }}
                    className={cn(
                      "group w-full overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] text-left ring-1 transition-shadow hover:shadow-lg disabled:cursor-default",
                      accent.ring
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-44 items-center justify-center bg-gradient-to-br from-foreground/10 to-foreground/5 bg-cover bg-center text-5xl",
                        listing.imageUrl && "text-transparent"
                      )}
                      style={
                        listing.imageUrl
                          ? { backgroundImage: `url(${listing.imageUrl})` }
                          : undefined
                      }
                    >
                      {!listing.imageUrl ? "🏠" : null}
                    </div>
                    <div className="p-5">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                          accent.badge
                        )}
                      >
                        {listing.type}
                      </span>
                      <h3 className="mt-2 font-semibold leading-snug">
                        {listing.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-foreground/55">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {listing.location}
                      </p>
                      <p className="mt-4 text-xl font-bold tabular-nums">
                        {formatIdr(listing.price, locale)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-foreground/50">
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5" />
                          {listing.bedrooms} {labels.bed}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5" />
                          {listing.bathrooms} {labels.bath}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Maximize2 className="h-3.5 w-3.5" />
                          {listing.area} m²
                        </span>
                        {(listing.landArea ?? 0) > 0 ? (
                          <span className="text-foreground/40">
                            LT {listing.landArea} m²
                          </span>
                        ) : null}
                      </div>
                      {siteSlug ? (
                        <p className={cn("mt-4 text-xs font-semibold", accent.text)}>
                          {labels.viewDetail} →
                        </p>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 rounded-xl border border-dashed border-foreground/15 px-6 py-10 text-center text-sm text-foreground/45">
              {labels.noListings}
            </p>
          )}
        </section>

        {config.howItWorks && config.howItWorks.length > 0 ? (
          <section id="how-it-works" className="mt-16 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight">
              {labels.howItWorksTitle}
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
              {config.howItWorks.map((step) => (
                <li
                  key={step.id}
                  className={cn("rounded-2xl border p-6", accent.card)}
                >
                  <span
                    className={cn(
                      "inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                      accent.badge,
                      "border"
                    )}
                  >
                    {step.step}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {config.whyChooseUs && config.whyChooseUs.length > 0 ? (
          <section id="about" className="mt-16 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight">
              {labels.whyChooseUsTitle}
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {config.whyChooseUs.map((item) => (
                <li
                  key={item.id}
                  className={cn("rounded-2xl border p-6 text-center", accent.card)}
                >
                  <p className={cn("text-3xl font-bold tabular-nums", accent.text)}>
                    {item.value}
                  </p>
                  <p className="mt-2 font-semibold">{item.label}</p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-foreground/55">
                      {item.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {config.about ? (
              <div className="mt-10 rounded-2xl border border-foreground/10 p-6">
                <h3 className="font-semibold">{labels.aboutTitle}</h3>
                <p className="mt-3 max-w-3xl leading-relaxed text-foreground/70">
                  {config.about}
                </p>
              </div>
            ) : null}
          </section>
        ) : config.about ? (
          <section id="about" className="mt-16 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight">
              {labels.aboutTitle}
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-foreground/70">
              {config.about}
            </p>
          </section>
        ) : null}

        {config.agents && config.agents.length > 0 ? (
          <section id="agents" className="mt-16 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight">
              {labels.agentsTitle}
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {config.agents.map((agent) => (
                <li
                  key={agent.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border border-foreground/10",
                    accent.ring,
                    "ring-1"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-32 items-center justify-center bg-gradient-to-br from-foreground/10 to-foreground/5 bg-cover bg-center text-4xl",
                      agent.imageUrl && "text-transparent"
                    )}
                    style={
                      agent.imageUrl
                        ? { backgroundImage: `url(${agent.imageUrl})` }
                        : undefined
                    }
                  >
                    {!agent.imageUrl ? "👤" : null}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold">{agent.name}</h3>
                    {agent.role ? (
                      <p className="text-sm text-foreground/55">{agent.role}</p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-2">
                      <StarRating rating={agent.rating ?? 5} />
                      <span className="text-xs text-foreground/45">
                        {(agent.rating ?? 5).toFixed(1)}
                      </span>
                    </div>
                    {(agent.listingsSold ?? 0) > 0 ? (
                      <p className="mt-2 text-xs text-foreground/45">
                        {agent.listingsSold} {labels.listingsSold}
                      </p>
                    ) : null}
                    {agent.phone ? (
                      <a
                        href={`tel:${agent.phone.replace(/\s/g, "")}`}
                        className={cn(
                          "mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold",
                          accent.btn
                        )}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {labels.callUs}
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {config.testimonials && config.testimonials.length > 0 ? (
          <section id="testimonials" className="mt-16 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight">
              {labels.testimonialsTitle}
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {config.testimonials.map((item) => (
                <li
                  key={item.id}
                  className={cn("rounded-2xl border p-6", accent.card)}
                >
                  <StarRating rating={item.rating ?? 5} />
                  <p className="mt-4 text-sm leading-relaxed text-foreground/75">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <p className="mt-4 font-semibold">{item.name}</p>
                  {item.role ? (
                    <p className="text-xs text-foreground/45">{item.role}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {config.popularAreas && config.popularAreas.length > 0 ? (
          <section id="areas" className="mt-16 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight">
              {labels.popularAreasTitle}
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {config.popularAreas.map((area) => (
                <li
                  key={area.id}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border border-foreground/10",
                    accent.ring,
                    "ring-1"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-28 items-end bg-gradient-to-t from-black/70 to-transparent bg-cover bg-center p-4",
                      !area.imageUrl && "from-foreground/20 to-foreground/5"
                    )}
                    style={
                      area.imageUrl
                        ? { backgroundImage: `url(${area.imageUrl})` }
                        : undefined
                    }
                  >
                    <p className="font-semibold text-white drop-shadow">
                      {area.name}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {config.blogPosts && config.blogPosts.length > 0 ? (
          <section id="blog" className="mt-16 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight">
              {labels.blogTitle}
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {config.blogPosts.map((post) => (
                <li key={post.id}>
                  <button
                    type="button"
                    disabled={!siteSlug}
                    onClick={() => {
                      if (siteSlug) openBlogPostHash(siteSlug, post.id);
                    }}
                    className={cn(
                      "w-full overflow-hidden rounded-2xl border border-foreground/10 text-left ring-1 transition-shadow hover:shadow-lg disabled:cursor-default",
                      accent.ring
                    )}
                  >
                    <div
                      className={cn(
                        "h-36 bg-gradient-to-br from-foreground/10 to-foreground/5 bg-cover bg-center",
                        post.imageUrl && "bg-none"
                      )}
                      style={
                        post.imageUrl
                          ? { backgroundImage: `url(${post.imageUrl})` }
                          : undefined
                      }
                    />
                    <div className="p-5">
                      <span
                        className={cn(
                          "text-[10px] font-semibold uppercase",
                          accent.text
                        )}
                      >
                        {post.category}
                      </span>
                      <h3 className="mt-2 font-semibold leading-snug">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm text-foreground/60">
                        {post.excerpt}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        {post.date ? (
                          <p className="text-xs text-foreground/40">{post.date}</p>
                        ) : (
                          <span />
                        )}
                        {siteSlug ? (
                          <span className={cn("text-xs font-semibold", accent.text)}>
                            {labels.readMore} →
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section id="contact" className="mt-16 scroll-mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">
            {labels.contactTitle}
          </h2>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <ul className="space-y-4 text-sm text-foreground/65">
              {config.contact.phone ? (
                <li className="flex items-center gap-3">
                  <Phone className={cn("h-4 w-4 shrink-0", accent.text)} />
                  <a
                    href={`tel:${config.contact.phone.replace(/\s/g, "")}`}
                    className="hover:text-foreground"
                  >
                    {config.contact.phone}
                  </a>
                </li>
              ) : null}
              {config.contact.whatsapp ? (
                <li className="flex items-center gap-3">
                  <MessageCircle
                    className={cn("h-4 w-4 shrink-0", accent.text)}
                  />
                  <a
                    href={`https://wa.me/${config.contact.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                  >
                    {labels.whatsapp}
                  </a>
                </li>
              ) : null}
              {config.contact.email ? (
                <li className="flex items-center gap-3">
                  <Mail className={cn("h-4 w-4 shrink-0", accent.text)} />
                  <a
                    href={`mailto:${config.contact.email}`}
                    className="hover:text-foreground"
                  >
                    {config.contact.email}
                  </a>
                </li>
              ) : null}
              {config.contact.address ? (
                <li className="flex items-start gap-3">
                  <MapPin
                    className={cn("mt-0.5 h-4 w-4 shrink-0", accent.text)}
                  />
                  {config.contact.address}
                </li>
              ) : null}
            </ul>

            {config.contact.showForm !== false ? (
              formSent ? (
                <p className={cn("rounded-2xl border p-6 text-sm", accent.card)}>
                  {labels.contactFormThanks}
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setFormSent(true);
                  }}
                  className={cn("space-y-4 rounded-2xl border p-6", accent.card)}
                >
                  <input
                    required
                    placeholder={labels.contactFormName}
                    className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm"
                  />
                  <input
                    required
                    type="email"
                    placeholder={labels.contactFormEmail}
                    className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm"
                  />
                  <input
                    placeholder={labels.contactFormPhone}
                    className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm"
                  />
                  <textarea
                    required
                    rows={4}
                    placeholder={labels.contactFormMessage}
                    className="w-full resize-y rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className={cn(
                      "w-full rounded-xl px-4 py-2.5 text-sm font-semibold",
                      accent.btn
                    )}
                  >
                    {labels.contactFormSubmit}
                  </button>
                </form>
              )
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}
