"use client";

import Link from "next/link";
import { ArrowRight, Check, LayoutList, MousePointerClick, Palette, Search, Store } from "lucide-react";
import { useLocale } from "@/components/layout/LocaleProvider";
import { companyTemplates, type CompanyTemplate } from "@/content/company-templates";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

type L = Record<Locale, string>;

const COPY = {
  aboutTitle: { id: "Tentang template ini", en: "About this template" },
  sectionsTitle: { id: "Isi halaman", en: "What's on the page" },
  interactiveTitle: { id: "Fitur interaktif", en: "Interactive features" },
  idealTitle: { id: "Cocok untuk", en: "A good fit for" },
  customTitle: { id: "Bisa disesuaikan", en: "What can be customised" },
  techTitle: { id: "Teknis, SEO & aksesibilitas", en: "Technical, SEO & accessibility" },
  stepsTitle: { id: "Cara pemesanan", en: "How ordering works" },
  othersTitle: { id: "Template lainnya", en: "Other templates" },
  cta: { id: "Gunakan template ini", en: "Use this template" },
  ctaHint: {
    id: "Ceritakan bisnis Anda — saya sesuaikan template ini dengan brand, konten, dan domain Anda.",
    en: "Tell me about your business — I'll tailor this template to your brand, content and domain.",
  },
  layout: { corporate: { id: "Korporat", en: "Corporate" }, bold: { id: "Tegas", en: "Bold" }, minimal: { id: "Minimalis", en: "Minimal" } },
  interactive: [
    { id: "Menu navigasi mobile dan penanda bagian yang sedang dibaca", en: "Mobile navigation menu and active-section highlighting" },
    { id: "Tombol WhatsApp mengambang dan form kontak dengan validasi", en: "Floating WhatsApp button and a validated contact form" },
    { id: "Slider testimoni, FAQ akordeon, dan animasi saat scroll", en: "Testimonial slider, FAQ accordion and scroll animations" },
  ],
  custom: [
    { id: "Logo, warna, dan jenis huruf", en: "Logo, colours and typefaces" },
    { id: "Teks, foto, daftar layanan, dan tim", en: "Copy, photos, services and team" },
    { id: "Nomor WhatsApp, alamat, dan jam operasional", en: "WhatsApp number, address and opening hours" },
    { id: "Widget sesuai alur bisnis (booking, kalkulator, menu, dll.)", en: "Widgets that match your workflow (booking, calculators, menus…)" },
    { id: "Domain dan email bisnis Anda", en: "Your own domain and business email" },
  ],
  tech: [
    { id: "Halaman statis berbasis Next.js — cepat dimuat, termasuk di jaringan seluler", en: "Static pages built with Next.js — fast, including on mobile networks" },
    { id: "Responsif di desktop, tablet, dan mobile", en: "Responsive on desktop, tablet and mobile" },
    { id: "Title, deskripsi, Open Graph, dan structured data bisnis lokal (schema.org)", en: "Title, description, Open Graph and local-business structured data (schema.org)" },
    { id: "Kontras warna dan navigasi keyboard sesuai pedoman aksesibilitas", en: "Colour contrast and keyboard navigation that follow accessibility guidelines" },
  ],
  steps: [
    { t: { id: "Diskusi kebutuhan", en: "Discuss your needs" }, d: { id: "Ceritakan bisnis Anda, halaman, dan fitur yang dibutuhkan.", en: "Tell me about your business and the pages and features you need." } },
    { t: { id: "Penyesuaian", en: "Customisation" }, d: { id: "Konten, warna, logo, dan widget disesuaikan dengan brand Anda.", en: "Content, colours, logo and widgets are adapted to your brand." } },
    { t: { id: "Review & revisi", en: "Review & revisions" }, d: { id: "Anda meninjau versi online sebelum situs tayang.", en: "You review an online version before the site goes live." } },
    { t: { id: "Tayang", en: "Launch" }, d: { id: "Situs dipasang di domain Anda, siap diindeks Google.", en: "The site goes live on your domain, ready for Google to index." } },
  ],
} satisfies Record<string, unknown>;

const WIDGET_EN: Record<CompanyTemplate["widget"]["type"], string> = {
  booking: "appointment booking",
  estimator: "cost estimator",
  menu: "menu & online ordering",
  shipping: "shipping-cost calculator",
  quiz: "program-finder quiz",
};

function sectionsOf(t: CompanyTemplate): L[] {
  return [
    { id: "Hero dengan tombol ajakan (CTA)", en: "Hero with call-to-action" },
    { id: `Statistik (${t.stats.length} angka)`, en: `Key stats (${t.stats.length})` },
    { id: `Layanan (${t.services.length})`, en: `Services (${t.services.length})` },
    { id: t.widget.title, en: `Interactive tool: ${WIDGET_EN[t.widget.type]}` },
    { id: "Tentang perusahaan", en: "About the company" },
    { id: `Proses kerja (${t.process.length} langkah)`, en: `Process (${t.process.length} steps)` },
    { id: `Tim (${t.team.length} orang)`, en: `Team (${t.team.length})` },
    { id: `Testimoni (${t.testimonials.length})`, en: `Testimonials (${t.testimonials.length})` },
    { id: `FAQ (${t.faq.length} pertanyaan)`, en: `FAQ (${t.faq.length})` },
    { id: "Kontak dengan form", en: "Contact section with form" },
  ];
}

/**
 * Crawlable description of a template, below the live preview. Template pages
 * default to Indonesian (see LocaleProvider), so that's what crawlers see.
 */
export function TemplateDetails({ template }: { template: CompanyTemplate }) {
  const { locale: lang } = useLocale();

  const l = (v: L) => v[lang];
  const others = companyTemplates.filter((o) => o.slug !== template.slug);

  return (
    <article lang={lang} className="border-t border-foreground/10 bg-background">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-text">
          {lang === "id" ? "Template website company profile" : "Company profile website template"} ·{" "}
          {l(COPY.layout[template.layout])}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {template.name} — {lang === "id" ? "template website" : "website template for"} {template.industry[lang].toLowerCase()}
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-foreground/70">{template.summary[lang]}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/contact?template=${template.slug}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            {l(COPY.cta)} <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="max-w-md self-center text-sm text-foreground/60">{l(COPY.ctaHint)}</p>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2">
          <Block icon={LayoutList} title={l(COPY.sectionsTitle)} items={sectionsOf(template).map(l)} />
          <Block
            icon={MousePointerClick}
            title={l(COPY.interactiveTitle)}
            lead={`${template.widget.title} — ${template.widget.subtitle}`}
            items={COPY.interactive.map(l)}
          />
          <Block icon={Store} title={l(COPY.idealTitle)} items={template.idealFor.map(l)} />
          <Block icon={Palette} title={l(COPY.customTitle)} items={COPY.custom.map(l)} />
          <Block icon={Search} title={l(COPY.techTitle)} items={COPY.tech.map(l)} className="md:col-span-2" />
        </div>

        <section className="mt-14">
          <h2 className="text-xl font-semibold">{l(COPY.stepsTitle)}</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COPY.steps.map((s, i) => (
              <li key={s.t.en} className="rounded-xl border border-foreground/10 p-4">
                <span className="text-xs font-semibold text-primary-text">{String(i + 1).padStart(2, "0")}</span>
                <p className="mt-1 font-semibold">{l(s.t)}</p>
                <p className="mt-1 text-sm text-foreground/65">{l(s.d)}</p>
              </li>
            ))}
          </ol>
        </section>

        <nav className="mt-14" aria-labelledby="other-templates">
          <h2 id="other-templates" className="text-xl font-semibold">{l(COPY.othersTitle)}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/templates/${o.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-foreground/10 p-4 transition-colors hover:bg-foreground/5"
                >
                  <span className="flex shrink-0 gap-1">
                    <span className="h-3 w-3 rounded-full" style={{ background: o.theme.primary }} />
                    <span className="h-3 w-3 rounded-full" style={{ background: o.theme.accent }} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{o.name}</span>
                    <span className="block truncate text-xs text-foreground/55">{o.industry[lang]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </article>
  );
}

function Block({
  icon: Icon,
  title,
  lead,
  items,
  className,
}: {
  icon: typeof Check;
  title: string;
  lead?: string;
  items: string[];
  className?: string;
}) {
  return (
    <section className={className}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Icon className="h-5 w-5 text-primary-text" /> {title}
      </h2>
      {lead && <p className="mt-2 text-sm text-foreground/70">{lead}</p>}
      <ul className={cn("mt-3 grid gap-2", items.length > 6 && "sm:grid-cols-2")}>
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-sm text-foreground/75">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-text" /> {it}
          </li>
        ))}
      </ul>
    </section>
  );
}
