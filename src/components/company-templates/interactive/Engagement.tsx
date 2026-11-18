"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Quote, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useWhatsApp } from "@/components/company-templates/interactive/TemplateShell";
import { tone } from "@/components/company-templates/interactive/ui";
import { cn } from "@/lib/utils";

type Testimonial = { quote: string; name: string; role: string };

/** Auto-advancing testimonial slider (pauses on hover/focus, arrows + dots). */
export function TestimonialCarousel({ items, dark, large }: { items: Testimonial[]; dark: boolean; large?: boolean }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const c = tone(dark);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(id);
  }, [paused, items.length]);

  const go = (d: number) => setIndex((i) => (i + d + items.length) % items.length);
  const t = items[index];

  return (
    <div
      className="mx-auto max-w-3xl text-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <Quote className="mx-auto h-9 w-9 text-[var(--tp)]" />
      <div className="relative mt-5 min-h-[9rem]" aria-live="polite">
        <blockquote key={index} className={cn("animate-[fadeIn_.5s_ease]", large ? "text-2xl font-bold leading-snug md:text-3xl" : "text-lg leading-relaxed")}>
          “{t.quote}”
        </blockquote>
        <p className={cn("mt-5 text-sm", c.muted)}>
          <span className={cn("font-semibold", c.text)}>{t.name}</span> · {t.role}
        </p>
      </div>
      {items.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button type="button" aria-label="Sebelumnya" onClick={() => go(-1)} className={cn("rounded-full border p-2", c.chip)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Testimoni ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-[var(--tp)]" : cn("w-2", dark ? "bg-neutral-700" : "bg-slate-300"))}
              />
            ))}
          </div>
          <button type="button" aria-label="Berikutnya" onClick={() => go(1)} className={cn("rounded-full border p-2", c.chip)}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export function FaqAccordion({ items, dark }: { items: { q: string; a: string }[]; dark: boolean }) {
  const [open, setOpen] = useState<number | null>(0);
  const c = tone(dark);
  return (
    <div className={cn("divide-y rounded-2xl", dark ? "divide-neutral-800 border border-neutral-800" : "divide-slate-200 border border-slate-200")}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold"
            >
              {item.q}
              <ChevronDown className={cn("h-5 w-5 shrink-0 text-[var(--tp)] transition-transform", isOpen && "rotate-180")} />
            </button>
            <div className={cn("grid transition-all duration-300", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <p className={cn("overflow-hidden px-5 text-sm leading-relaxed", c.muted, isOpen && "pb-5")}>{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const EMAIL_OR_PHONE = /^([^\s@]+@[^\s@]+\.[^\s@]+|[+\d][\d\s-]{7,})$/;

/** Validated contact form → WhatsApp message preview. */
export function ContactForm({ companyName, dark, button }: { companyName: string; dark: boolean; button: string }) {
  const openWhatsApp = useWhatsApp();
  const c = tone(dark);
  const [form, setForm] = useState({ name: "", contact: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (form.name.trim().length < 2) next.name = "Isi nama Anda.";
    if (!EMAIL_OR_PHONE.test(form.contact.trim())) next.contact = "Isi email atau nomor WhatsApp yang valid.";
    if (form.message.trim().length < 10) next.message = "Ceritakan kebutuhan Anda (min. 10 karakter).";
    setErrors(next);
    if (Object.keys(next).length) return;
    openWhatsApp({
      title: "Kirim pesan",
      message: `Halo ${companyName},\n\nNama: ${form.name.trim()}\nKontak: ${form.contact.trim()}\n\n${form.message.trim()}`,
    });
  }

  const field = (key: keyof typeof form, label: string, textarea?: boolean) => (
    <label className="block">
      <span className={cn("text-xs font-semibold uppercase tracking-wide", c.muted)}>{label}</span>
      {textarea ? (
        <textarea rows={4} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={cn(c.input, "mt-1.5 resize-y")} aria-invalid={!!errors[key]} />
      ) : (
        <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={cn(c.input, "mt-1.5")} aria-invalid={!!errors[key]} />
      )}
      {errors[key] && <span className="mt-1 block text-xs text-red-500">{errors[key]}</span>}
    </label>
  );

  return (
    <form noValidate onSubmit={submit} className={cn("space-y-4 rounded-2xl p-6 md:p-8", c.card)}>
      {field("name", "Nama")}
      {field("contact", "Email / WhatsApp")}
      {field("message", "Pesan", true)}
      <button type="submit" className={cn("inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--tp)] py-3 font-semibold", dark ? "text-neutral-950" : "text-white")}>
        <Send className="h-4 w-4" /> {button}
      </button>
    </form>
  );
}
