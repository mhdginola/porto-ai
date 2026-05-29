import type { PropertyAgencyConfig } from "@/lib/property-agency/schemas";

export type ThemeAccent = NonNullable<
  PropertyAgencyConfig["theme"]
>["accent"];

export const THEME_ACCENT_OPTIONS: {
  id: ThemeAccent;
  label: string;
  swatch: string;
}[] = [
  { id: "emerald", label: "Emerald", swatch: "bg-emerald-500" },
  { id: "blue", label: "Blue", swatch: "bg-blue-500" },
  { id: "teal", label: "Teal", swatch: "bg-teal-500" },
  { id: "cyan", label: "Cyan", swatch: "bg-cyan-500" },
  { id: "indigo", label: "Indigo", swatch: "bg-indigo-500" },
  { id: "violet", label: "Violet", swatch: "bg-violet-500" },
  { id: "fuchsia", label: "Fuchsia", swatch: "bg-fuchsia-500" },
  { id: "rose", label: "Rose", swatch: "bg-rose-500" },
  { id: "red", label: "Red", swatch: "bg-red-500" },
  { id: "orange", label: "Orange", swatch: "bg-orange-500" },
  { id: "amber", label: "Amber", swatch: "bg-amber-500" },
  { id: "lime", label: "Lime", swatch: "bg-lime-500" },
  { id: "slate", label: "Slate", swatch: "bg-slate-500" },
];

export function resolveThemeAccent(accent?: string): ThemeAccent {
  const found = THEME_ACCENT_OPTIONS.find((o) => o.id === accent);
  return found?.id ?? "emerald";
}
