/**
 * Renders a company-profile template from src/content/company-templates.ts.
 * Pure server component (no client JS). Colours come from CSS variables so one
 * layout can carry any theme; the template ignores the portfolio's dark mode.
 */
import {
  ArrowRight,
  Award,
  Baby,
  BookOpen,
  Briefcase,
  Building2,
  Cake,
  ChartColumn,
  Check,
  Clock,
  Code,
  Coffee,
  FileText,
  Globe,
  HardHat,
  Heart,
  Mail,
  MapPin,
  Package,
  Phone,
  Quote,
  Ruler,
  Scale,
  Shield,
  Smile,
  Stethoscope,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { CompanyTemplate, TemplateIcon } from "@/content/company-templates";
import { ContactForm, FaqAccordion, TestimonialCarousel } from "@/components/company-templates/interactive/Engagement";
import { CountUp, Reveal } from "@/components/company-templates/interactive/Motion";
import { MobileMenu, SpyNav, type NavLink } from "@/components/company-templates/interactive/Navigation";
import { TemplateShell } from "@/components/company-templates/interactive/TemplateShell";
import { TemplateWidgetView } from "@/components/company-templates/interactive/Widgets";
import { jsonLdString, templateJsonLd } from "@/lib/company-template-seo";
import { cn } from "@/lib/utils";

const ICONS: Record<TemplateIcon, LucideIcon> = {
  scale: Scale,
  briefcase: Briefcase,
  shield: Shield,
  file: FileText,
  hardhat: HardHat,
  building: Building2,
  ruler: Ruler,
  truck: Truck,
  stethoscope: Stethoscope,
  heart: Heart,
  baby: Baby,
  smile: Smile,
  coffee: Coffee,
  cake: Cake,
  users: Users,
  package: Package,
  globe: Globe,
  clock: Clock,
  book: BookOpen,
  code: Code,
  award: Award,
  chart: ChartColumn,
};

/** Map a nav label to the section it scrolls to. */
function sectionFor(label: string): string {
  const l = label.toLowerCase();
  if (/beranda|home/.test(l)) return "#top";
  if (/konsultasi|janji|estimasi|pesan|ongkir|cari program/.test(l)) return "#tools";
  if (/layanan|menu|program|service/.test(l)) return "#services";
  if (/tentang|cerita|about|story/.test(l)) return "#about";
  if (/tim|dokter|mentor|team/.test(l)) return "#team";
  if (/proses|process/.test(l)) return "#process";
  return "#contact";
}

function navLinks(t: CompanyTemplate): NavLink[] {
  return t.nav.map((label) => ({ label, href: sectionFor(label) }));
}

function initials(name: string) {
  return name
    .replace(/^(dr|drg|ir|bidan)\.?\s+/i, "")
    .split(/[\s,]+/)
    .filter((p) => /^[A-Za-z]/.test(p))
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function TemplateSite({ template }: { template: CompanyTemplate }) {
  const vars = {
    "--tp": template.theme.primary,
    "--ta": template.theme.accent,
    // Accent as *text* needs more contrast on light backgrounds (WCAG AA 4.5:1).
    "--ta-text": template.theme.dark
      ? template.theme.accent
      : `color-mix(in oklab, ${template.theme.accent}, black 52%)`,
  } as CSSProperties;
  const pageBg = template.theme.dark ? "#0a0a0a" : "#ffffff";
  const font = template.theme.font === "serif" ? "font-serif" : "font-sans";

  return (
    <div
      id="top"
      lang="id"
      style={vars}
      className={cn(
        "min-h-screen scroll-smooth antialiased",
        template.theme.dark ? "bg-neutral-950 text-neutral-100" : "bg-white text-slate-900"
      )}
    >
      {/* The template is the whole document: own background (not the portfolio's
          theme), and schema.org data for search engines. */}
      <style>{`html,body{background:${pageBg};color-scheme:${template.theme.dark ? "dark" : "light"}}`}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(templateJsonLd(template)) }}
      />
      <TemplateShell companyName={template.company.name} whatsapp={template.whatsapp} dark={template.theme.dark}>
        {template.layout === "corporate" && <CorporateLayout t={template} font={font} />}
        {template.layout === "bold" && <BoldLayout t={template} font={font} />}
        {template.layout === "minimal" && <MinimalLayout t={template} font={font} />}
      </TemplateShell>
      <p
        className={cn(
          "py-3 text-center text-[11px]",
          template.theme.dark ? "bg-black text-neutral-400" : "bg-slate-100 text-slate-600"
        )}
      >
        Template demo · konten fiktif · dibuat oleh Ginola
      </p>
    </div>
  );
}

type LayoutProps = { t: CompanyTemplate; font: string };

/* ======================= Corporate ======================= */

function CorporateLayout({ t, font }: LayoutProps) {
  return (
    <>
      <div className="hidden bg-[var(--tp)] text-xs text-white/85 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {t.contact.address}
          </span>
          <span className="flex gap-5">
            <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {t.contact.phone}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {t.contact.hours}</span>
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2.5">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-md bg-[var(--tp)] text-sm font-bold text-white", font)}>
              {t.company.name[0]}
            </span>
            <span>
              <span className={cn("block text-lg font-bold leading-tight text-[var(--tp)]", font)}>{t.company.name}</span>
              <span className="block text-[11px] uppercase tracking-wider text-slate-500">{t.company.tagline}</span>
            </span>
          </a>
          <SpyNav
            links={navLinks(t)}
            className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex"
            linkClass="border-b-2 border-transparent py-1 hover:text-[var(--tp)]"
            activeClass="border-[var(--ta)] text-[var(--tp)]"
          />
          <MobileMenu links={navLinks(t)} dark={false} />
          <a href="#contact" className="hidden whitespace-nowrap rounded-md bg-[var(--ta)] px-4 py-2 text-sm font-semibold text-slate-900 hover:opacity-90 sm:inline-block">
            {t.hero.cta}
          </a>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--ta-text)]">{t.hero.eyebrow}</p>
            <h1 className={cn("mt-4 text-4xl font-bold leading-tight text-[var(--tp)] md:text-5xl", font)}>{t.hero.title}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">{t.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#contact" className="inline-flex items-center gap-2 rounded-md bg-[var(--tp)] px-6 py-3 font-semibold text-white hover:opacity-90">
                {t.hero.cta} <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#services" className="rounded-md border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:border-[var(--tp)] hover:text-[var(--tp)]">
                {t.hero.secondaryCta}
              </a>
            </div>
          </div>
          <div className="rounded-2xl bg-[var(--tp)] p-8 text-white shadow-2xl">
            <div className="grid grid-cols-2 gap-6">
              {t.stats.map((s) => (
                <div key={s.label}>
                  <p className={cn("text-3xl font-bold text-[var(--ta)]", font)}><CountUp value={s.value} /></p>
                  <p className="mt-1 text-sm text-white/90">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 border-t border-white/15 pt-6 text-sm text-white/90">
              <Quote className="mb-2 h-5 w-5 text-[var(--ta)]" />
              {t.testimonials[0].quote}
              <p className="mt-2 text-xs font-semibold text-white">— {t.testimonials[0].name}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading eyebrow="Layanan" title="Apa yang kami kerjakan" font={font} className="text-[var(--tp)]" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.services.map((s, i) => {
            const Icon = ICONS[s.icon];
            return (
              <Reveal key={s.title} delay={(i % 3) * 100}>
              <div className="group h-full rounded-xl border border-slate-200 p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--tp)]/10 text-[var(--tp)] group-hover:bg-[var(--tp)] group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className={cn("mt-4 text-lg font-bold", font)}>{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.description}</p>
              </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <ToolsSection t={t} font={font} headingClass="text-[var(--tp)]" sectionClass="bg-slate-50" />

      <section id="about">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <PatternPanel className="aspect-[4/3] rounded-2xl" label={t.company.name} font={font} />
          <div>
            <SectionHeading eyebrow="Tentang kami" title={t.about.title} font={font} className="text-[var(--tp)]" align="left" />
            <p className="mt-5 leading-relaxed text-slate-600">{t.about.body}</p>
            <ul className="mt-6 space-y-3">
              {t.about.points.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ta)] text-slate-900">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-slate-700">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="process" className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading eyebrow="Proses" title="Cara kami bekerja" font={font} className="text-[var(--tp)]" />
        <ol className="mt-10 grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          {t.process.map((p, i) => (
            <li key={p.title} className="relative rounded-xl border-t-4 border-[var(--tp)] bg-white p-6 shadow-sm">
              <span className={cn("text-3xl font-bold text-[var(--tp)]", font)}>0{i + 1}</span>
              <h3 className="mt-2 font-bold">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{p.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="team" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <SectionHeading eyebrow="Tim" title="Orang-orang di balik layanan kami" font={font} className="text-[var(--tp)]" />
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {t.team.map((m) => (
              <div key={m.name} className="rounded-xl bg-white p-6 text-center shadow-sm">
                <Avatar name={m.name} className="mx-auto h-20 w-20 text-xl" />
                <p className={cn("mt-4 font-bold", font)}>{m.name}</p>
                <p className="text-sm text-slate-500">{m.role}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {t.testimonials.slice(1).map((q) => (
              <TestimonialCard key={q.name} q={q} />
            ))}
          </div>
        </div>
      </section>

      <FaqSection t={t} font={font} headingClass="text-[var(--tp)]" />

      <section className="bg-[var(--tp)] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-14 md:flex-row md:items-center">
          <div>
            <h2 className={cn("text-2xl font-bold md:text-3xl", font)}>{t.cta.title}</h2>
            <p className="mt-2 text-white/90">{t.cta.subtitle}</p>
          </div>
          <a href="#contact" className="rounded-md bg-[var(--ta)] px-6 py-3 font-semibold text-slate-900">{t.cta.button}</a>
        </div>
      </section>

      <section id="contact" className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2">
        <div>
          <SectionHeading eyebrow="Kontak" title="Kirim pesan kepada kami" font={font} className="text-[var(--tp)]" align="left" />
          <p className="mt-4 text-slate-600">{t.cta.subtitle}</p>
          <div className="mt-8 rounded-2xl bg-slate-900 p-6"><ContactList t={t} /></div>
        </div>
        <ContactForm companyName={t.company.name} dark={false} button="Kirim Pesan" />
      </section>

      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
          <div>
            <p className={cn("text-lg font-bold text-white", font)}>{t.company.name}</p>
            <p className="mt-2 text-sm text-slate-400">{t.company.tagline}</p>
          </div>
          <ContactList t={t} />
          <div>
            <p className="text-sm font-semibold text-white">Navigasi</p>
            <ul className="mt-3 space-y-2 text-sm">
              {t.nav.map((n) => (
                <li key={n}><a href={sectionFor(n)} className="hover:text-white">{n}</a></li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ======================= Bold ======================= */

function BoldLayout({ t, font }: LayoutProps) {
  return (
    <>
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <a href="#top" className={cn("text-xl font-black uppercase tracking-tight", font)}>
            {t.company.name}
            <span className="text-[var(--tp)]">.</span>
          </a>
          <SpyNav
            links={navLinks(t)}
            className="hidden items-center gap-8 text-sm font-semibold uppercase tracking-wide text-neutral-300 md:flex"
            linkClass="hover:text-[var(--tp)]"
            activeClass="text-[var(--tp)]"
          />
          <div className="flex items-center gap-2">
            <a href="#contact" className="hidden whitespace-nowrap rounded-full border-2 border-[var(--tp)] px-4 py-2 text-sm font-bold text-[var(--tp)] hover:bg-[var(--tp)] hover:text-neutral-950 sm:inline-block sm:px-5">
              {t.hero.cta}
            </a>
            <MobileMenu links={navLinks(t)} dark />
          </div>
        </div>
      </header>

      <section className="relative flex min-h-[92vh] items-end overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, var(--tp) 0, transparent 45%), radial-gradient(circle at 10% 90%, var(--ta) 0, transparent 35%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-40">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--ta)]">{t.hero.eyebrow}</p>
          <h1 className={cn("mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl", font)}>
            {t.hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-neutral-300">{t.hero.subtitle}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#contact" className="inline-flex items-center gap-2 rounded-full bg-[var(--tp)] px-7 py-3.5 font-bold text-neutral-950 hover:opacity-90">
              {t.hero.cta} <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#services" className="rounded-full border border-neutral-600 px-7 py-3.5 font-bold text-neutral-200 hover:border-neutral-300">
              {t.hero.secondaryCta}
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-800 bg-neutral-900">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-neutral-800 px-6 md:grid-cols-4">
          {t.stats.map((s) => (
            <div key={s.label} className="px-4 py-10 first:pl-0">
              <p className={cn("text-4xl font-black text-[var(--tp)] md:text-5xl", font)}><CountUp value={s.value} /></p>
              <p className="mt-2 text-sm uppercase tracking-wide text-neutral-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--ta)]">Layanan</h2>
        <div className="mt-8 divide-y divide-neutral-800 border-y border-neutral-800">
          {t.services.map((s, i) => {
            const Icon = ICONS[s.icon];
            return (
              <Reveal key={s.title} delay={i * 80}>
              <div className="group grid items-center gap-4 py-8 md:grid-cols-[80px_1fr_1.2fr_40px]">
                <span className={cn("text-2xl font-black text-neutral-600 group-hover:text-[var(--tp)]", font)}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={cn("text-2xl font-bold md:text-3xl", font)}>{s.title}</h3>
                <p className="text-neutral-400">{s.description}</p>
                <Icon className="hidden h-7 w-7 text-neutral-600 group-hover:text-[var(--tp)] md:block" />
              </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <ToolsSection t={t} font={font} headingClass="" sectionClass="border-t border-neutral-800" />

      <section id="about" className="bg-[var(--tp)] text-neutral-950">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2">
          <h2 className={cn("text-4xl font-black leading-tight md:text-5xl", font)}>{t.about.title}</h2>
          <div>
            <p className="text-lg leading-relaxed text-neutral-950">{t.about.body}</p>
            <ul className="mt-8 grid gap-3">
              {t.about.points.map((p) => (
                <li key={p} className="flex items-center gap-3 border-b border-neutral-950/15 pb-3 font-semibold">
                  <Check className="h-5 w-5" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="process" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--ta)]">Proses</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-neutral-800 md:grid-cols-4">
          {t.process.map((p, i) => (
            <div key={p.title} className="bg-neutral-950 p-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--tp)] font-black text-neutral-950">
                {i + 1}
              </span>
              <h3 className="mt-6 text-lg font-bold">{p.title}</h3>
              <p className="mt-2 text-sm text-neutral-400">{p.description}</p>
            </div>
          ))}
        </div>
        <div className={cn("mt-24", font)}>
          <TestimonialCarousel items={t.testimonials} dark large />
        </div>
      </section>

      <FaqSection t={t} font={font} headingClass="" />

      <section id="contact" className="border-t border-neutral-800 bg-neutral-900">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2">
          <div>
            <h2 className={cn("text-4xl font-black", font)}>{t.cta.title}</h2>
            <p className="mt-4 text-neutral-400">{t.cta.subtitle}</p>
            <div className="mt-8"><ContactList t={t} dark /></div>
          </div>
          <ContactForm companyName={t.company.name} dark button={t.cta.button} />
        </div>
      </section>
    </>
  );
}

/* ======================= Minimal ======================= */

function MinimalLayout({ t, font }: LayoutProps) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <a href="#top" className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[var(--tp)]" />
            <span className={cn("font-semibold tracking-tight", font)}>
              {t.company.name} <span className="hidden font-normal text-slate-400 sm:inline">{t.company.tagline}</span>
            </span>
          </a>
          <SpyNav
            links={navLinks(t)}
            className="hidden items-center gap-1 text-sm text-slate-500 md:flex"
            linkClass="rounded-full px-3 py-1.5 hover:text-slate-900"
            activeClass="bg-[var(--tp)]/10 text-[var(--tp)]"
          />
          <MobileMenu links={navLinks(t)} dark={false} />
          <a href="#contact" className="hidden whitespace-nowrap rounded-full bg-slate-900 sm:inline-block px-4 py-2 text-sm font-medium text-white hover:bg-[var(--tp)]">
            {t.hero.cta}
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-[var(--ta)] opacity-30 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--tp)]" /> {t.hero.eyebrow}
          </span>
          <h1 className={cn("mt-6 text-4xl font-semibold leading-tight tracking-tight md:text-6xl", font)}>{t.hero.title}</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">{t.hero.subtitle}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href="#contact" className="rounded-full bg-[var(--tp)] px-6 py-3 font-medium text-white hover:opacity-90">{t.hero.cta}</a>
            <a href="#services" className="rounded-full px-6 py-3 font-medium text-slate-600 hover:text-slate-900">
              {t.hero.secondaryCta} →
            </a>
          </div>
          <div className="mx-auto mt-14 grid max-w-xl grid-cols-3 gap-6">
            {t.stats.map((s) => (
              <div key={s.label}>
                <p className={cn("text-3xl font-semibold text-[var(--tp)]", font)}><CountUp value={s.value} /></p>
                <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeading eyebrow="Layanan" title="Yang bisa kami bantu" font={font} align="left" />
        <div className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
          {t.services.map((s, i) => {
            const Icon = ICONS[s.icon];
            return (
              <Reveal key={s.title} delay={(i % 2) * 100}>
              <div className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--tp)]/10 text-[var(--tp)]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{s.description}</p>
                </div>
              </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <ToolsSection t={t} font={font} headingClass="" sectionClass="" narrow />

      <section id="about" className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid items-center gap-10 rounded-3xl bg-slate-50 p-8 md:grid-cols-2 md:p-12">
          <div>
            <h2 className={cn("text-3xl font-semibold tracking-tight", font)}>{t.about.title}</h2>
            <p className="mt-4 leading-relaxed text-slate-600">{t.about.body}</p>
          </div>
          <ul className="space-y-3">
            {t.about.points.map((p) => (
              <li key={p} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                <Check className="h-4 w-4 text-[var(--tp)]" /> {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="team" className="mx-auto max-w-5xl px-6 py-20">
        <SectionHeading eyebrow="Tim" title="Kenalan dengan tim kami" font={font} align="left" />
        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
          {t.team.map((m) => (
            <div key={m.name}>
              <Avatar name={m.name} className="aspect-square w-full rounded-3xl text-3xl" />
              <p className="mt-3 text-sm font-semibold">{m.name}</p>
              <p className="text-xs text-slate-500">{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="process" className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {t.process.map((p, i) => (
            <div key={p.title} className="rounded-3xl border border-slate-200 p-6">
              <p className="text-xs font-medium text-[var(--tp)]">Langkah {i + 1}</p>
              <h3 className="mt-2 font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{p.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 rounded-3xl bg-slate-50 px-6 py-12">
          <TestimonialCarousel items={t.testimonials} dark={false} />
        </div>
      </section>

      <FaqSection t={t} font={font} headingClass="" narrow />

      <section id="contact" className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-3xl bg-[var(--tp)] p-8 text-white md:p-12">
          <h2 className={cn("text-3xl font-semibold tracking-tight", font)}>{t.cta.title}</h2>
          <p className="mt-2 text-white">{t.cta.subtitle}</p>
          <div className="mt-8 grid gap-4 text-sm md:grid-cols-4">
            {[
              { icon: MapPin, value: t.contact.address },
              { icon: Phone, value: t.contact.phone },
              { icon: Mail, value: t.contact.email },
              { icon: Clock, value: t.contact.hours },
            ].map(({ icon: Icon, value }) => (
              <div key={value} className="rounded-2xl bg-black/15 p-4">
                <Icon className="h-4 w-4 text-[var(--ta)]" />
                <p className="mt-2 text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <ContactForm companyName={t.company.name} dark={false} button={t.cta.button} />
        </div>
      </section>
    </>
  );
}

/* ======================= shared bits ======================= */

/** Industry-specific interactive tool (booking, estimator, menu, shipping, quiz). */
function ToolsSection({
  t,
  font,
  headingClass,
  sectionClass,
  narrow,
}: LayoutProps & { headingClass: string; sectionClass?: string; narrow?: boolean }) {
  return (
    <section id="tools" className={sectionClass}>
      <div className={cn("mx-auto px-6 py-20", narrow ? "max-w-5xl" : "max-w-6xl")}>
        <Reveal>
          <SectionHeading eyebrow="Online" title={t.widget.title} font={font} className={headingClass} align={narrow ? "left" : "center"} />
          <p className={cn("mt-3 max-w-2xl opacity-70", !narrow && "mx-auto text-center")}>{t.widget.subtitle}</p>
        </Reveal>
        <div className="mt-10">
          <TemplateWidgetView template={t} />
        </div>
      </div>
    </section>
  );
}

function FaqSection({ t, font, headingClass, narrow }: LayoutProps & { headingClass: string; narrow?: boolean }) {
  return (
    <section id="faq" className={cn("mx-auto px-6 py-20", narrow ? "max-w-5xl" : "max-w-3xl")}>
      <SectionHeading eyebrow="FAQ" title="Pertanyaan yang sering diajukan" font={font} className={headingClass} align={narrow ? "left" : "center"} />
      <div className="mt-10">
        <FaqAccordion items={t.faq} dark={t.theme.dark} />
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  font,
  className,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  font: string;
  className?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <p className="text-sm font-semibold uppercase tracking-widest text-[var(--ta-text)]">{eyebrow}</p>
      <h2 className={cn("mt-2 text-3xl font-bold tracking-tight md:text-4xl", font, className)}>{title}</h2>
    </div>
  );
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center rounded-full font-bold text-white", className)}
      style={{ background: "linear-gradient(135deg, var(--tp), var(--ta))" }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

function PatternPanel({ className, label, font }: { className?: string; label: string; font: string }) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ background: "linear-gradient(135deg, var(--tp), color-mix(in oklab, var(--tp) 60%, var(--ta)))" }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      />
      <span className={cn("absolute bottom-6 left-6 text-3xl font-bold text-white/90", font)}>{label}</span>
    </div>
  );
}

function TestimonialCard({ q }: { q: { quote: string; name: string; role: string } }) {
  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900">
      <Quote className="h-5 w-5 text-[var(--tp)]" />
      <blockquote className="mt-3 text-sm leading-relaxed text-slate-600">“{q.quote}”</blockquote>
      <figcaption className="mt-4 text-sm font-semibold">
        {q.name} <span className="font-normal text-slate-500">· {q.role}</span>
      </figcaption>
    </figure>
  );
}

function ContactList({ t, dark }: { t: CompanyTemplate; dark?: boolean }) {
  return (
    <ul className="space-y-3 text-sm">
      {[
        { icon: MapPin, value: t.contact.address },
        { icon: Phone, value: t.contact.phone },
        { icon: Mail, value: t.contact.email },
        { icon: Clock, value: t.contact.hours },
      ].map(({ icon: Icon, value }) => (
        <li key={value} className="flex items-start gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tp)]" />
          <span className={dark ? "text-neutral-300" : "text-slate-300"}>{value}</span>
        </li>
      ))}
    </ul>
  );
}
