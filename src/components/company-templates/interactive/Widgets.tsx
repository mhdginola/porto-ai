"use client";

import { Calendar, Check, Minus, Plus, RotateCcw, ShoppingBag, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { CompanyTemplate, TemplateWidget } from "@/content/company-templates";
import { useWhatsApp } from "@/components/company-templates/interactive/TemplateShell";
import { rupiah, tone } from "@/components/company-templates/interactive/ui";
import { cn } from "@/lib/utils";

type Props = { template: CompanyTemplate };

/** Renders the template's industry-specific tool. */
export function TemplateWidgetView({ template }: Props) {
  const w = template.widget;
  switch (w.type) {
    case "booking":
      return <BookingWidget template={template} widget={w} />;
    case "estimator":
      return <EstimatorWidget template={template} widget={w} />;
    case "menu":
      return <MenuWidget template={template} widget={w} />;
    case "shipping":
      return <ShippingWidget template={template} widget={w} />;
    case "quiz":
      return <QuizWidget template={template} widget={w} />;
  }
}

function Chip({ active, onClick, children, dark, disabled, title }: { active: boolean; onClick: () => void; children: React.ReactNode; dark: boolean; disabled?: boolean; title?: string }) {
  const c = tone(dark);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-35 disabled:line-through", active ? c.chipActive : c.chip)}
    >
      {children}
    </button>
  );
}

function Step({ n, label, dark, children }: { n: number; label: string; dark: boolean; children: React.ReactNode }) {
  return (
    <div>
      <p className={cn("mb-2.5 flex items-center gap-2 text-sm font-semibold", tone(dark).text)}>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--tp)] text-[11px] text-white">{n}</span>
        {label}
      </p>
      {children}
    </div>
  );
}

/* ---------- Booking (consultation / appointment) ---------- */

const DAY = new Intl.DateTimeFormat("id-ID", { weekday: "short" });
const DATE = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });
const LONG = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Deterministic "already booked" slots so the demo looks realistic but stable. */
function isTaken(dateKey: string, slot: string, person: string) {
  let h = 0;
  for (const ch of `${dateKey}${slot}${person}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 4 === 0;
}

function BookingWidget({ template, widget }: Props & { widget: Extract<TemplateWidget, { type: "booking" }> }) {
  const dark = template.theme.dark;
  const c = tone(dark);
  const openWhatsApp = useWhatsApp();
  const days = useMemo(() => {
    const out: Date[] = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (out.length < widget.daysAhead) {
      d.setDate(d.getDate() + 1);
      if (!widget.closedDays.includes(d.getDay())) out.push(new Date(d));
    }
    return out;
  }, [widget.daysAhead, widget.closedDays]);

  const [topic, setTopic] = useState(widget.topics[0]);
  const [person, setPerson] = useState(template.team[0].name);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const dateKey = days[day]?.toISOString().slice(0, 10) ?? "";

  function confirm() {
    if (!slot || name.trim().length < 2) return;
    openWhatsApp({
      title: widget.title,
      message: `Halo ${template.company.name}, saya ingin membuat janji.\n\nNama: ${name.trim()}\n${widget.topicLabel}: ${topic}\n${widget.personLabel}: ${person}\nWaktu: ${LONG.format(days[day])}, pukul ${slot}\n\nMohon konfirmasinya. Terima kasih.`,
    });
  }

  return (
    <div className={cn("grid gap-6 rounded-3xl p-6 md:grid-cols-[1.4fr_1fr] md:p-8", c.card)}>
      <div className="space-y-6">
        <Step n={1} label={widget.topicLabel} dark={dark}>
          <div className="flex flex-wrap gap-2">
            {widget.topics.map((t) => (
              <Chip key={t} active={topic === t} onClick={() => setTopic(t)} dark={dark}>{t}</Chip>
            ))}
          </div>
        </Step>
        <Step n={2} label={widget.personLabel} dark={dark}>
          <div className="flex flex-wrap gap-2">
            {template.team.map((m) => (
              <Chip key={m.name} active={person === m.name} onClick={() => { setPerson(m.name); setSlot(null); }} dark={dark}>{m.name}</Chip>
            ))}
          </div>
        </Step>
        <Step n={3} label="Tanggal" dark={dark}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((d, i) => (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => { setDay(i); setSlot(null); }}
                aria-pressed={day === i}
                className={cn("min-w-[4.25rem] shrink-0 rounded-xl border px-2 py-2 text-center text-xs transition-colors", day === i ? c.chipActive : c.chip)}
              >
                <span className="block uppercase">{DAY.format(d)}</span>
                <span className="block text-sm font-semibold">{DATE.format(d)}</span>
              </button>
            ))}
          </div>
        </Step>
        <Step n={4} label="Jam" dark={dark}>
          <div className="flex flex-wrap gap-2">
            {widget.slots.map((s) => {
              const taken = isTaken(dateKey, s, person);
              return (
                <Chip key={s} active={slot === s} onClick={() => setSlot(s)} dark={dark} disabled={taken} title={taken ? "Sudah penuh" : undefined}>
                  {s}
                </Chip>
              );
            })}
          </div>
        </Step>
      </div>

      <aside className={cn("flex flex-col rounded-2xl p-5", c.subtle)}>
        <p className={cn("flex items-center gap-2 text-sm font-semibold", c.text)}>
          <Calendar className="h-4 w-4 text-[var(--tp)]" /> Ringkasan
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          {[
            [widget.topicLabel, topic],
            [widget.personLabel, person],
            ["Tanggal", days[day] ? LONG.format(days[day]) : "—"],
            ["Jam", slot ?? "Pilih jam"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className={cn("text-xs", c.muted)}>{k}</dt>
              <dd className={cn("font-medium", v === "Pilih jam" ? cn(c.muted, "italic") : c.text)}>{v}</dd>
            </div>
          ))}
        </dl>
        <label className="mt-5 block">
          <span className={cn("text-xs", c.muted)}>Nama Anda</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" className={cn(c.input, "mt-1")} />
        </label>
        <button
          type="button"
          onClick={confirm}
          disabled={!slot || name.trim().length < 2}
          className={cn("mt-4 w-full rounded-full bg-[var(--tp)] py-3 font-semibold transition-opacity disabled:opacity-40", dark ? "text-neutral-950" : "text-white")}
        >
          Konfirmasi via WhatsApp
        </button>
        <p className={cn("mt-2 text-center text-[11px]", c.muted)}>Slot yang dicoret sudah dipesan.</p>
      </aside>
    </div>
  );
}

/* ---------- Cost estimator (construction) ---------- */

function EstimatorWidget({ template, widget }: Props & { widget: Extract<TemplateWidget, { type: "estimator" }> }) {
  const dark = template.theme.dark;
  const c = tone(dark);
  const openWhatsApp = useWhatsApp();
  const [type, setType] = useState(0);
  const [finish, setFinish] = useState(0);
  const [area, setArea] = useState(widget.area.default);
  const [floors, setFloors] = useState(1);

  const bt = widget.buildingTypes[type];
  const mult = widget.finishes[finish].multiplier * (1 + (floors - 1) * 0.08); // each extra floor adds structure cost
  const low = Math.round((bt.pricePerM2[0] * area * mult) / 1_000_000) * 1_000_000;
  const high = Math.round((bt.pricePerM2[1] * area * mult) / 1_000_000) * 1_000_000;
  const months = Math.max(2, Math.round((area / 450) * (1 + (floors - 1) * 0.3) + 1));
  const compact = (n: number) => (n >= 1e9 ? `Rp${(n / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M` : `Rp${(n / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 0 })} jt`);

  return (
    <div className={cn("grid gap-8 rounded-3xl p-6 md:grid-cols-2 md:p-8", c.card)}>
      <div className="space-y-6">
        <Step n={1} label="Jenis bangunan" dark={dark}>
          <div className="flex flex-wrap gap-2">
            {widget.buildingTypes.map((b, i) => (
              <Chip key={b.label} active={type === i} onClick={() => setType(i)} dark={dark}>{b.label}</Chip>
            ))}
          </div>
        </Step>
        <Step n={2} label={`Luas bangunan: ${area.toLocaleString("id-ID")} m²`} dark={dark}>
          <input
            type="range"
            min={widget.area.min}
            max={widget.area.max}
            step={50}
            value={area}
            onChange={(e) => setArea(Number(e.target.value))}
            className="w-full accent-[var(--tp)]"
            aria-label="Luas bangunan"
          />
          <div className={cn("flex justify-between text-[11px]", c.muted)}>
            <span>{widget.area.min} m²</span>
            <span>{widget.area.max.toLocaleString("id-ID")} m²</span>
          </div>
        </Step>
        <Step n={3} label="Jumlah lantai" dark={dark}>
          <div className="inline-flex items-center gap-3">
            <button type="button" aria-label="Kurangi lantai" onClick={() => setFloors((f) => Math.max(1, f - 1))} className={cn("rounded-full border p-2", c.chip)}><Minus className="h-4 w-4" /></button>
            <span className={cn("w-8 text-center text-lg font-bold", c.text)}>{floors}</span>
            <button type="button" aria-label="Tambah lantai" onClick={() => setFloors((f) => Math.min(widget.floorsMax, f + 1))} className={cn("rounded-full border p-2", c.chip)}><Plus className="h-4 w-4" /></button>
          </div>
        </Step>
        <Step n={4} label="Kualitas finishing" dark={dark}>
          <div className="flex flex-wrap gap-2">
            {widget.finishes.map((f, i) => (
              <Chip key={f.label} active={finish === i} onClick={() => setFinish(i)} dark={dark}>{f.label}</Chip>
            ))}
          </div>
        </Step>
      </div>

      <div className="flex flex-col justify-between rounded-2xl bg-[var(--tp)] p-6 text-neutral-950">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide">Estimasi biaya</p>
          <p className="mt-3 text-3xl font-black leading-tight md:text-4xl">{compact(low)} – {compact(high)}</p>
          <p className="mt-2 text-sm">≈ {rupiah(Math.round((low + high) / 2 / area))} per m² (rata-rata)</p>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-black/15 pt-5 text-sm">
            <div><p>Perkiraan durasi</p><p className="text-lg font-bold">{months} bulan</p></div>
            <div><p>Luas total</p><p className="text-lg font-bold">{(area * floors).toLocaleString("id-ID")} m²</p></div>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            openWhatsApp({
              title: widget.title,
              message: `Halo ${template.company.name}, saya ingin survei & penawaran.\n\nJenis: ${bt.label}\nLuas: ${area.toLocaleString("id-ID")} m² × ${floors} lantai\nFinishing: ${widget.finishes[finish].label}\nEstimasi dari website: ${compact(low)} – ${compact(high)}`,
            })
          }
          className="mt-6 w-full rounded-full bg-neutral-950 py-3 font-bold text-white hover:opacity-90"
        >
          Minta survei & RAB
        </button>
        <p className="mt-2 text-center text-[11px]">Angka indikatif, bukan penawaran resmi.</p>
      </div>
    </div>
  );
}

/* ---------- Menu & order (F&B) ---------- */

function MenuWidget({ template, widget }: Props & { widget: Extract<TemplateWidget, { type: "menu" }> }) {
  const dark = template.theme.dark;
  const c = tone(dark);
  const openWhatsApp = useWhatsApp();
  const [cat, setCat] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});
  const items = widget.categories.flatMap((k) => k.items);
  const lines = Object.entries(cart).filter(([, q]) => q > 0).map(([name, qty]) => ({ name, qty, price: items.find((i) => i.name === name)!.price }));
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const change = (name: string, d: number) => setCart((c0) => ({ ...c0, [name]: Math.max(0, (c0[name] ?? 0) + d) }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <div className="flex flex-wrap gap-2">
          {widget.categories.map((k, i) => (
            <Chip key={k.name} active={cat === i} onClick={() => setCat(i)} dark={dark}>{k.name}</Chip>
          ))}
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {widget.categories[cat].items.map((item) => {
            const qty = cart[item.name] ?? 0;
            return (
              <li key={item.name} className={cn("flex flex-col rounded-2xl p-4", c.card)}>
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("font-semibold", c.text)}>{item.name}</p>
                  {item.tag && <span className="shrink-0 rounded-full bg-[var(--ta)] px-2 py-0.5 text-[10px] font-bold text-neutral-900">{item.tag}</span>}
                </div>
                <p className={cn("mt-1 flex-1 text-sm", c.muted)}>{item.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-bold text-[var(--tp)]">{rupiah(item.price)}</span>
                  {qty === 0 ? (
                    <button type="button" onClick={() => change(item.name, 1)} className="rounded-full bg-[var(--tp)] px-3 py-1 text-sm font-semibold text-neutral-950">Tambah</button>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <button type="button" aria-label={`Kurangi ${item.name}`} onClick={() => change(item.name, -1)} className={cn("rounded-full border p-1", c.chip)}><Minus className="h-3.5 w-3.5" /></button>
                      <span className={cn("w-5 text-center font-semibold", c.text)}>{qty}</span>
                      <button type="button" aria-label={`Tambah ${item.name}`} onClick={() => change(item.name, 1)} className={cn("rounded-full border p-1", c.chip)}><Plus className="h-3.5 w-3.5" /></button>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className={cn("h-fit rounded-2xl p-5 lg:sticky lg:top-6", c.card)}>
        <p className={cn("flex items-center gap-2 font-semibold", c.text)}>
          <ShoppingBag className="h-4 w-4 text-[var(--tp)]" /> Pesanan ({count})
        </p>
        {lines.length === 0 ? (
          <p className={cn("mt-4 text-sm", c.muted)}>Belum ada menu dipilih.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {lines.map((l) => (
              <li key={l.name} className="flex justify-between gap-3">
                <span className={c.text}>{l.qty}× {l.name}</span>
                <span className={c.muted}>{rupiah(l.qty * l.price)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className={cn("mt-4 flex justify-between border-t pt-4 font-bold", c.border, c.text)}>
          <span>Total</span>
          <span>{rupiah(total)}</span>
        </div>
        <button
          type="button"
          disabled={count === 0}
          onClick={() =>
            openWhatsApp({
              title: widget.title,
              message: `Halo ${template.company.name}, saya mau pesan untuk diambil:\n\n${lines.map((l) => `• ${l.qty}× ${l.name} — ${rupiah(l.qty * l.price)}`).join("\n")}\n\nTotal: ${rupiah(total)}`,
            })
          }
          className="mt-4 w-full rounded-full bg-[var(--tp)] py-3 font-bold text-neutral-950 disabled:opacity-40"
        >
          Pesan via WhatsApp
        </button>
        {count > 0 && (
          <button type="button" onClick={() => setCart({})} className={cn("mt-2 inline-flex w-full items-center justify-center gap-1 text-xs", c.muted)}>
            <RotateCcw className="h-3 w-3" /> Kosongkan
          </button>
        )}
      </aside>
    </div>
  );
}

/* ---------- Shipping calculator (logistics) ---------- */

function ShippingWidget({ template, widget }: Props & { widget: Extract<TemplateWidget, { type: "shipping" }> }) {
  const dark = template.theme.dark;
  const c = tone(dark);
  const openWhatsApp = useWhatsApp();
  const [from, setFrom] = useState(widget.cities[0].name);
  const [to, setTo] = useState(widget.cities[3]?.name ?? widget.cities[1].name);
  const [weight, setWeight] = useState(5);
  const zone = (n: string) => widget.cities.find((x) => x.name === n)!.zone;
  const distance = Math.abs(zone(from) - zone(to)) + (from === to ? 0 : 1);

  const quotes = widget.services.map((s) => {
    const kg = s.name.startsWith("Kargo") ? Math.max(10, weight) : Math.max(1, Math.ceil(weight));
    const price = Math.round((s.base + s.perKg * kg * (1 + distance * 0.45)) / 500) * 500;
    return { ...s, price, eta: [s.etaDays[0] + Math.floor(distance / 2), s.etaDays[1] + Math.floor(distance / 2)] as const };
  });
  const cheapest = Math.min(...quotes.map((q) => q.price));

  return (
    <div className={cn("rounded-3xl p-6 md:p-8", c.card)}>
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_160px]">
        <label className="block">
          <span className={cn("text-xs font-semibold", c.muted)}>Kota asal</span>
          <select value={from} onChange={(e) => setFrom(e.target.value)} className={cn(c.input, "mt-1")}>
            {widget.cities.map((x) => <option key={x.name}>{x.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={cn("text-xs font-semibold", c.muted)}>Kota tujuan</span>
          <select value={to} onChange={(e) => setTo(e.target.value)} className={cn(c.input, "mt-1")}>
            {widget.cities.map((x) => <option key={x.name}>{x.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={cn("text-xs font-semibold", c.muted)}>Berat (kg)</span>
          <input type="number" min={0.5} max={1000} step={0.5} value={weight} onChange={(e) => setWeight(Math.max(0.5, Number(e.target.value) || 0.5))} className={cn(c.input, "mt-1")} />
        </label>
      </div>
      <ul className="mt-6 grid gap-3 md:grid-cols-3">
        {quotes.map((q) => (
          <li key={q.name} className={cn("relative rounded-2xl border-2 p-5", q.price === cheapest ? "border-[var(--tp)]" : c.border)}>
            {q.price === cheapest && <span className="absolute -top-3 left-4 rounded-full bg-[var(--tp)] px-2 py-0.5 text-[10px] font-bold text-white">Termurah</span>}
            <p className={cn("text-sm font-semibold", c.text)}>{q.name}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--tp)]">{rupiah(q.price)}</p>
            <p className={cn("mt-1 text-xs", c.muted)}>Estimasi {q.eta[0]}–{q.eta[1]} hari</p>
            <button
              type="button"
              onClick={() =>
                openWhatsApp({
                  title: widget.title,
                  message: `Halo ${template.company.name}, saya ingin jadwalkan pickup.\n\nRute: ${from} → ${to}\nBerat: ${weight} kg\nLayanan: ${q.name}\nEstimasi tarif: ${rupiah(q.price)} (${q.eta[0]}–${q.eta[1]} hari)`,
                })
              }
              className={cn("mt-4 w-full rounded-lg border py-2 text-sm font-medium", c.chip)}
            >
              Jadwalkan pickup
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Program finder quiz (education) ---------- */

function QuizWidget({ template, widget }: Props & { widget: Extract<TemplateWidget, { type: "quiz" }> }) {
  const dark = template.theme.dark;
  const c = tone(dark);
  const openWhatsApp = useWhatsApp();
  const [answers, setAnswers] = useState<number[]>([]);
  const step = answers.length;
  const done = step >= widget.questions.length;

  const result = useMemo(() => {
    if (!done) return null;
    const scores: Record<string, number> = {};
    answers.forEach((a, qi) => {
      for (const [k, v] of Object.entries(widget.questions[qi].options[a].scores)) scores[k] = (scores[k] ?? 0) + v;
    });
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    return widget.results[best];
  }, [done, answers, widget]);

  return (
    <div className={cn("mx-auto max-w-2xl rounded-3xl p-6 md:p-8", c.card)}>
      <div className="flex gap-1.5">
        {widget.questions.map((_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < step ? "bg-[var(--tp)]" : dark ? "bg-neutral-800" : "bg-slate-200")} />
        ))}
      </div>
      {!done ? (
        <div key={step} className="mt-6 animate-[fadeIn_.4s_ease]">
          <p className={cn("text-xs font-semibold uppercase tracking-wide", c.muted)}>Pertanyaan {step + 1} dari {widget.questions.length}</p>
          <p className={cn("mt-2 text-xl font-semibold", c.text)}>{widget.questions[step].question}</p>
          <div className="mt-5 grid gap-2">
            {widget.questions[step].options.map((o, i) => (
              <button key={o.label} type="button" onClick={() => setAnswers([...answers, i])} className={cn("rounded-xl border px-4 py-3 text-left text-sm transition-colors hover:border-[var(--tp)]", c.chip)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        result && (
          <div className="mt-6 animate-[fadeIn_.4s_ease] text-center">
            <Sparkles className="mx-auto h-8 w-8 text-[var(--tp)]" />
            <p className={cn("mt-3 text-sm", c.muted)}>Program yang paling cocok untuk Anda</p>
            <p className={cn("mt-1 text-2xl font-bold", c.text)}>{result.name}</p>
            <p className={cn("mx-auto mt-2 max-w-md text-sm", c.muted)}>{result.description}</p>
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <span className={c.text}><Check className="mr-1 inline h-4 w-4 text-[var(--tp)]" />{result.duration}</span>
              <span className={c.text}>{rupiah(result.price)}</span>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => openWhatsApp({ title: widget.title, message: `Halo ${template.company.name}, saya tertarik dengan program ${result.name} (${result.duration}). Bisa info jadwal kelas terdekat?` })}
                className="rounded-full bg-[var(--tp)] px-6 py-3 font-semibold text-white"
              >
                Tanya jadwal kelas
              </button>
              <button type="button" onClick={() => setAnswers([])} className={cn("inline-flex items-center gap-1 rounded-full border px-5 py-3 text-sm", c.chip)}>
                <RotateCcw className="h-4 w-4" /> Ulangi
              </button>
            </div>
          </div>
        )
      )}
      {step > 0 && !done && (
        <button type="button" onClick={() => setAnswers(answers.slice(0, -1))} className={cn("mt-5 text-xs", c.muted)}>
          ← Kembali
        </button>
      )}
    </div>
  );
}
