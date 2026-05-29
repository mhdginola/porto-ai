"use client";

import { THEME_ACCENT_OPTIONS, type ThemeAccent } from "@/lib/property-agency/theme-accents";
import { cn } from "@/lib/utils";

type Props = {
  value: ThemeAccent;
  onChange: (accent: ThemeAccent) => void;
};

export function ThemeAccentPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7">
      {THEME_ACCENT_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-colors",
            value === option.id
              ? "border-foreground/40 bg-foreground/5 ring-2 ring-primary/40"
              : "border-foreground/10 hover:border-foreground/25"
          )}
        >
          <span
            className={cn("h-7 w-7 rounded-full shadow-inner", option.swatch)}
          />
          <span className="text-[10px] font-medium text-foreground/60">
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}
