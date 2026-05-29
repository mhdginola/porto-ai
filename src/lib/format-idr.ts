/** IDR formatting for dashboard and tables. */

export type KpiHeadline =
  | { kind: "parts"; prefix?: string; value: string; suffix?: string }
  | { kind: "plain"; value: string };

export type KpiDisplay = {
  headline: KpiHeadline;
  caption: string;
};

export function formatIdr(value: number, locale: "en" | "id") {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Shorter IDR for tight UI (product cards, chips). */
export function formatIdrCompact(value: number, locale: "en" | "id") {
  const numFmt = (n: number, opts: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", opts).format(n);

  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const formatted = numFmt(millions, {
      minimumFractionDigits: value % 1_000_000 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    });
    return locale === "id" ? `Rp ${formatted} jt` : `IDR ${formatted}M`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    const formatted = numFmt(thousands, { maximumFractionDigits: 0 });
    return locale === "id" ? `Rp ${formatted} rb` : `IDR ${formatted}K`;
  }
  return formatIdr(value, locale);
}

export function formatCount(value: number, locale: "en" | "id") {
  return new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US").format(value);
}

/** KPI headline + caption (no awkward Intl compact line breaks). */
export function formatRevenueKpi(value: number, locale: "en" | "id"): KpiDisplay {
  const millions = value / 1_000_000;
  const full = formatIdr(value, locale);
  const num = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(millions);

  if (locale === "id") {
    return {
      headline: { kind: "parts", prefix: "Rp", value: num, suffix: "jt" },
      caption: full,
    };
  }
  return {
    headline: { kind: "parts", prefix: "IDR", value: num, suffix: "M" },
    caption: full,
  };
}

export function formatNumberKpi(value: number, locale: "en" | "id"): KpiDisplay {
  const full = formatCount(value, locale);
  return { headline: { kind: "plain", value: full }, caption: full };
}

export function formatVisitorsKpi(value: number, locale: "en" | "id"): KpiDisplay {
  const full = formatCount(value, locale);
  const compact = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
  return {
    headline: { kind: "plain", value: compact },
    caption: full,
  };
}

export function formatOrderDate(iso: string, locale: "en" | "id") {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}
