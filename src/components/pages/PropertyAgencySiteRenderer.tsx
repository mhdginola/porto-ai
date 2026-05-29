"use client";

import {
  Bath,
  BedDouble,
  Building2,
  Mail,
  MapPin,
  Maximize2,
  Menu,
  Phone,
  X,
} from "lucide-react";
import { useState } from "react";
import type { PropertyAgencyConfig } from "@/lib/property-agency/schemas";
import { formatIdr } from "@/lib/format-idr";
import { cn } from "@/lib/utils";

const ACCENT: Record<
  NonNullable<PropertyAgencyConfig["theme"]>["accent"],
  {
    hero: string;
    btn: string;
    ring: string;
    text: string;
    badge: string;
    nav: string;
  }
> = {
  emerald: {
    hero: "from-emerald-950/90 via-emerald-900/70 to-background",
    btn: "bg-emerald-600 hover:bg-emerald-500 text-white",
    ring: "ring-emerald-500/30",
    text: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    nav: "border-emerald-500/20 bg-emerald-950/80",
  },
  blue: {
    hero: "from-blue-950/90 via-blue-900/70 to-background",
    btn: "bg-blue-600 hover:bg-blue-500 text-white",
    ring: "ring-blue-500/30",
    text: "text-blue-400",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    nav: "border-blue-500/20 bg-blue-950/80",
  },
  amber: {
    hero: "from-amber-950/90 via-amber-900/70 to-background",
    btn: "bg-amber-600 hover:bg-amber-500 text-white",
    ring: "ring-amber-500/30",
    text: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    nav: "border-amber-500/20 bg-amber-950/80",
  },
};

const NAV_LABELS = {
  en: {
    home: "Home",
    about: "About",
    listings: "Properties",
    contact: "Contact",
    viewListings: "View listings",
    callUs: "Call us",
    aboutTitle: "About us",
    listingsTitle: "Featured properties",
    listingsCount: "listings",
    contactTitle: "Contact us",
    noListings: "No listings yet.",
    bed: "bed",
    bath: "bath",
    footer: "Built with Property Agency Builder.",
  },
  id: {
    home: "Beranda",
    about: "Tentang",
    listings: "Properti",
    contact: "Kontak",
    viewListings: "Lihat properti",
    callUs: "Hubungi kami",
    aboutTitle: "Tentang kami",
    listingsTitle: "Properti unggulan",
    listingsCount: "listing",
    contactTitle: "Hubungi kami",
    noListings: "Belum ada listing.",
    bed: "kt",
    bath: "km",
    footer: "Dibuat dengan Property Agency Builder.",
  },
} as const;

type Props = {
  name: string;
  config: PropertyAgencyConfig;
  locale?: "en" | "id";
};

function AgencyNav({
  name,
  accent,
  phone,
  labels,
}: {
  name: string;
  accent: (typeof ACCENT)[keyof typeof ACCENT];
  phone?: string;
  labels: (typeof NAV_LABELS)[keyof typeof NAV_LABELS];
}) {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#top", label: labels.home },
    { href: "#about", label: labels.about },
    { href: "#listings", label: labels.listings },
    { href: "#contact", label: labels.contact },
  ];

  return (
    <nav
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-xl",
        accent.nav
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5 sm:px-10">
        <a href="#top" className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
              accent.badge
            )}
          >
            <Building2 className="h-4 w-4" />
          </span>
          <span className="truncate font-semibold tracking-tight">{name}</span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className={cn(
                "hidden items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:inline-flex",
                accent.btn
              )}
            >
              <Phone className="h-4 w-4" />
              {labels.callUs}
            </a>
          ) : (
            <a
              href="#listings"
              className={cn(
                "hidden rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:inline-flex",
                accent.btn
              )}
            >
              {labels.viewListings}
            </a>
          )}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/10 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-foreground/10 px-6 py-3 md:hidden">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-sm text-foreground/75"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            {phone ? (
              <li>
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className={cn(
                    "mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
                    accent.btn
                  )}
                >
                  <Phone className="h-4 w-4" />
                  {labels.callUs}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}

export function PropertyAgencySiteRenderer({
  name,
  config,
  locale = "en",
}: Props) {
  const accent = ACCENT[config.theme?.accent ?? "emerald"];
  const labels = NAV_LABELS[locale];
  const heroBg = config.hero.imageUrl
    ? { backgroundImage: `url(${config.hero.imageUrl})` }
    : undefined;

  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <AgencyNav
        name={name}
        accent={accent}
        phone={config.contact.phone}
        labels={labels}
      />

      <header
        className={cn(
          "relative flex min-h-[48vh] flex-col justify-end bg-cover bg-center px-6 pb-12 pt-8 sm:px-10",
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
        <div className="relative mx-auto w-full max-w-5xl">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.25em]",
              accent.text
            )}
          >
            {name}
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            {config.hero.title}
          </h1>
          {config.hero.subtitle ? (
            <p className="mt-4 max-w-xl text-lg text-foreground/75">
              {config.hero.subtitle}
            </p>
          ) : null}
          <a
            href="#listings"
            className={cn(
              "mt-8 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors",
              accent.btn
            )}
          >
            {labels.viewListings}
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
        {config.about ? (
          <section id="about" className="mb-16 scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight">
              {labels.aboutTitle}
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-foreground/70">
              {config.about}
            </p>
          </section>
        ) : null}

        <section id="listings" className="scroll-mt-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {labels.listingsTitle}
            </h2>
            <span className="text-sm text-foreground/45">
              {config.listings?.length ?? 0} {labels.listingsCount}
            </span>
          </div>

          {config.listings && config.listings.length > 0 ? (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {config.listings.map((listing) => (
                <li
                  key={listing.id}
                  className={cn(
                    "group overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.02] ring-1 transition-shadow hover:shadow-lg",
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
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 rounded-xl border border-dashed border-foreground/15 px-6 py-10 text-center text-sm text-foreground/45">
              {labels.noListings}
            </p>
          )}
        </section>
      </main>

      <footer
        id="contact"
        className="scroll-mt-20 border-t border-foreground/10 bg-foreground/[0.03] px-6 py-12 sm:px-10"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-semibold">{labels.contactTitle}</h2>
          <ul className="mt-6 space-y-3 text-sm text-foreground/65">
            {config.contact.phone ? (
              <li className="flex items-center gap-2">
                <Phone className={cn("h-4 w-4", accent.text)} />
                <a
                  href={`tel:${config.contact.phone.replace(/\s/g, "")}`}
                  className="hover:text-foreground"
                >
                  {config.contact.phone}
                </a>
              </li>
            ) : null}
            {config.contact.email ? (
              <li className="flex items-center gap-2">
                <Mail className={cn("h-4 w-4", accent.text)} />
                <a
                  href={`mailto:${config.contact.email}`}
                  className="hover:text-foreground"
                >
                  {config.contact.email}
                </a>
              </li>
            ) : null}
            {config.contact.address ? (
              <li className="flex items-start gap-2">
                <MapPin
                  className={cn("mt-0.5 h-4 w-4 shrink-0", accent.text)}
                />
                {config.contact.address}
              </li>
            ) : null}
          </ul>
          <p className="mt-8 text-xs text-foreground/35">
            © {new Date().getFullYear()} {name}. {labels.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}
