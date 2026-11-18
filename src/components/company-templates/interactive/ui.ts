/** Shared class strings so interactive pieces match light and dark templates. */
export function tone(dark: boolean) {
  return dark
    ? {
        card: "bg-neutral-900 border border-neutral-800",
        subtle: "bg-neutral-800/60",
        border: "border-neutral-700",
        text: "text-neutral-100",
        muted: "text-neutral-400",
        input:
          "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-[var(--tp)]",
        chip: "border-neutral-700 text-neutral-300 hover:border-neutral-500",
        chipActive: "border-[var(--tp)] bg-[var(--tp)] text-neutral-950",
      }
    : {
        card: "bg-white border border-slate-200 shadow-sm",
        subtle: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-900",
        muted: "text-slate-500",
        input:
          "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[var(--tp)] focus:ring-2 focus:ring-[var(--tp)]/15",
        chip: "border-slate-300 text-slate-600 hover:border-slate-400",
        chipActive: "border-[var(--tp)] bg-[var(--tp)] text-white",
      };
}

export function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
