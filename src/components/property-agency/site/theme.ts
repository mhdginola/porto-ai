import {
  resolveThemeAccent,
  type ThemeAccent,
} from "@/lib/property-agency/theme-accents";
import { normalizeHex } from "@/lib/property-agency/theme-color";

export type SiteAccent = {
  hero: string;
  btn: string;
  btnOutline: string;
  ring: string;
  text: string;
  badge: string;
  nav: string;
  card: string;
  sectionBg: string;
};

function palette(name: ThemeAccent): SiteAccent {
  const map: Record<ThemeAccent, SiteAccent> = {
    emerald: {
      hero: "from-emerald-950/90 via-emerald-900/70 to-background",
      btn: "bg-emerald-600 hover:bg-emerald-500 text-white",
      btnOutline:
        "border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10",
      ring: "ring-emerald-500/30",
      text: "text-emerald-400",
      badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      nav: "border-emerald-500/20 bg-emerald-950/80",
      card: "border-emerald-500/15 bg-emerald-500/[0.03]",
      sectionBg: "bg-emerald-500/[0.03]",
    },
    blue: {
      hero: "from-blue-950/90 via-blue-900/70 to-background",
      btn: "bg-blue-600 hover:bg-blue-500 text-white",
      btnOutline: "border border-blue-500/40 text-blue-400 hover:bg-blue-500/10",
      ring: "ring-blue-500/30",
      text: "text-blue-400",
      badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      nav: "border-blue-500/20 bg-blue-950/80",
      card: "border-blue-500/15 bg-blue-500/[0.03]",
      sectionBg: "bg-blue-500/[0.03]",
    },
    amber: {
      hero: "from-amber-950/90 via-amber-900/70 to-background",
      btn: "bg-amber-600 hover:bg-amber-500 text-white",
      btnOutline:
        "border border-amber-500/40 text-amber-400 hover:bg-amber-500/10",
      ring: "ring-amber-500/30",
      text: "text-amber-400",
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      nav: "border-amber-500/20 bg-amber-950/80",
      card: "border-amber-500/15 bg-amber-500/[0.03]",
      sectionBg: "bg-amber-500/[0.03]",
    },
    rose: {
      hero: "from-rose-950/90 via-rose-900/70 to-background",
      btn: "bg-rose-600 hover:bg-rose-500 text-white",
      btnOutline: "border border-rose-500/40 text-rose-400 hover:bg-rose-500/10",
      ring: "ring-rose-500/30",
      text: "text-rose-400",
      badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      nav: "border-rose-500/20 bg-rose-950/80",
      card: "border-rose-500/15 bg-rose-500/[0.03]",
      sectionBg: "bg-rose-500/[0.03]",
    },
    violet: {
      hero: "from-violet-950/90 via-violet-900/70 to-background",
      btn: "bg-violet-600 hover:bg-violet-500 text-white",
      btnOutline:
        "border border-violet-500/40 text-violet-400 hover:bg-violet-500/10",
      ring: "ring-violet-500/30",
      text: "text-violet-400",
      badge: "bg-violet-500/15 text-violet-400 border-violet-500/30",
      nav: "border-violet-500/20 bg-violet-950/80",
      card: "border-violet-500/15 bg-violet-500/[0.03]",
      sectionBg: "bg-violet-500/[0.03]",
    },
    cyan: {
      hero: "from-cyan-950/90 via-cyan-900/70 to-background",
      btn: "bg-cyan-600 hover:bg-cyan-500 text-white",
      btnOutline: "border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10",
      ring: "ring-cyan-500/30",
      text: "text-cyan-400",
      badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
      nav: "border-cyan-500/20 bg-cyan-950/80",
      card: "border-cyan-500/15 bg-cyan-500/[0.03]",
      sectionBg: "bg-cyan-500/[0.03]",
    },
    orange: {
      hero: "from-orange-950/90 via-orange-900/70 to-background",
      btn: "bg-orange-600 hover:bg-orange-500 text-white",
      btnOutline:
        "border border-orange-500/40 text-orange-400 hover:bg-orange-500/10",
      ring: "ring-orange-500/30",
      text: "text-orange-400",
      badge: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      nav: "border-orange-500/20 bg-orange-950/80",
      card: "border-orange-500/15 bg-orange-500/[0.03]",
      sectionBg: "bg-orange-500/[0.03]",
    },
    teal: {
      hero: "from-teal-950/90 via-teal-900/70 to-background",
      btn: "bg-teal-600 hover:bg-teal-500 text-white",
      btnOutline: "border border-teal-500/40 text-teal-400 hover:bg-teal-500/10",
      ring: "ring-teal-500/30",
      text: "text-teal-400",
      badge: "bg-teal-500/15 text-teal-400 border-teal-500/30",
      nav: "border-teal-500/20 bg-teal-950/80",
      card: "border-teal-500/15 bg-teal-500/[0.03]",
      sectionBg: "bg-teal-500/[0.03]",
    },
    red: {
      hero: "from-red-950/90 via-red-900/70 to-background",
      btn: "bg-red-600 hover:bg-red-500 text-white",
      btnOutline: "border border-red-500/40 text-red-400 hover:bg-red-500/10",
      ring: "ring-red-500/30",
      text: "text-red-400",
      badge: "bg-red-500/15 text-red-400 border-red-500/30",
      nav: "border-red-500/20 bg-red-950/80",
      card: "border-red-500/15 bg-red-500/[0.03]",
      sectionBg: "bg-red-500/[0.03]",
    },
    indigo: {
      hero: "from-indigo-950/90 via-indigo-900/70 to-background",
      btn: "bg-indigo-600 hover:bg-indigo-500 text-white",
      btnOutline:
        "border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10",
      ring: "ring-indigo-500/30",
      text: "text-indigo-400",
      badge: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
      nav: "border-indigo-500/20 bg-indigo-950/80",
      card: "border-indigo-500/15 bg-indigo-500/[0.03]",
      sectionBg: "bg-indigo-500/[0.03]",
    },
    fuchsia: {
      hero: "from-fuchsia-950/90 via-fuchsia-900/70 to-background",
      btn: "bg-fuchsia-600 hover:bg-fuchsia-500 text-white",
      btnOutline:
        "border border-fuchsia-500/40 text-fuchsia-400 hover:bg-fuchsia-500/10",
      ring: "ring-fuchsia-500/30",
      text: "text-fuchsia-400",
      badge: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
      nav: "border-fuchsia-500/20 bg-fuchsia-950/80",
      card: "border-fuchsia-500/15 bg-fuchsia-500/[0.03]",
      sectionBg: "bg-fuchsia-500/[0.03]",
    },
    lime: {
      hero: "from-lime-950/90 via-lime-900/70 to-background",
      btn: "bg-lime-600 hover:bg-lime-500 text-white",
      btnOutline: "border border-lime-500/40 text-lime-400 hover:bg-lime-500/10",
      ring: "ring-lime-500/30",
      text: "text-lime-400",
      badge: "bg-lime-500/15 text-lime-400 border-lime-500/30",
      nav: "border-lime-500/20 bg-lime-950/80",
      card: "border-lime-500/15 bg-lime-500/[0.03]",
      sectionBg: "bg-lime-500/[0.03]",
    },
    slate: {
      hero: "from-slate-950/90 via-slate-900/70 to-background",
      btn: "bg-slate-600 hover:bg-slate-500 text-white",
      btnOutline:
        "border border-slate-500/40 text-slate-300 hover:bg-slate-500/10",
      ring: "ring-slate-500/30",
      text: "text-slate-300",
      badge: "bg-slate-500/15 text-slate-300 border-slate-500/30",
      nav: "border-slate-500/20 bg-slate-950/80",
      card: "border-slate-500/15 bg-slate-500/[0.03]",
      sectionBg: "bg-slate-500/[0.03]",
    },
  };
  return map[name];
}

export const ACCENT: Record<ThemeAccent, SiteAccent> = {
  emerald: palette("emerald"),
  blue: palette("blue"),
  amber: palette("amber"),
  rose: palette("rose"),
  violet: palette("violet"),
  cyan: palette("cyan"),
  orange: palette("orange"),
  teal: palette("teal"),
  red: palette("red"),
  indigo: palette("indigo"),
  fuchsia: palette("fuchsia"),
  lime: palette("lime"),
  slate: palette("slate"),
};

export const CSS_VAR_ACCENT: SiteAccent = {
  hero: "from-[var(--pa-hero-from)] via-[var(--pa-hero-via)] to-background",
  btn: "bg-[var(--pa-accent)] hover:bg-[var(--pa-accent-hover)] text-white",
  btnOutline:
    "border border-[color-mix(in_oklab,var(--pa-accent)_40%,transparent)] text-[var(--pa-accent-text)] hover:bg-[color-mix(in_oklab,var(--pa-accent)_10%,transparent)]",
  ring: "ring-[color-mix(in_oklab,var(--pa-accent)_30%,transparent)]",
  text: "text-[var(--pa-accent-text)]",
  badge:
    "bg-[color-mix(in_oklab,var(--pa-accent)_15%,transparent)] text-[var(--pa-accent-text)] border-[color-mix(in_oklab,var(--pa-accent)_30%,transparent)]",
  nav: "border-[color-mix(in_oklab,var(--pa-accent)_20%,transparent)] bg-[color-mix(in_oklab,var(--pa-accent)_8%,black)]",
  card: "border-[color-mix(in_oklab,var(--pa-accent)_15%,transparent)] bg-[color-mix(in_oklab,var(--pa-accent)_3%,transparent)]",
  sectionBg: "bg-[color-mix(in_oklab,var(--pa-accent)_3%,transparent)]",
};

export function getSiteAccent(accent?: string, customColor?: string): SiteAccent {
  if (normalizeHex(customColor)) {
    return CSS_VAR_ACCENT;
  }
  return ACCENT[resolveThemeAccent(accent)];
}
