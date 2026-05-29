"use client";

import { X } from "lucide-react";
import { normalizeHex } from "@/lib/property-agency/theme-color";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (color: string) => void;
  onClear?: () => void;
  inputClass: string;
  clearLabel?: string;
  hint?: string;
};

export function ThemeColorPicker({
  value,
  onChange,
  onClear,
  inputClass,
  clearLabel = "Reset",
  hint,
}: Props) {
  const normalized = normalizeHex(value);
  const pickerValue = normalized ?? "#10b981";

  function handlePickerChange(hex: string) {
    onChange(hex);
  }

  function handleTextChange(raw: string) {
    onChange(raw);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="relative shrink-0 cursor-pointer">
          <span
            className="block h-10 w-10 rounded-xl border border-foreground/15 shadow-inner"
            style={{ backgroundColor: pickerValue }}
          />
          <input
            type="color"
            value={pickerValue}
            onChange={(e) => handlePickerChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Pick brand color"
          />
        </label>
        <input
          type="text"
          className={cn(inputClass, "font-mono uppercase")}
          value={value}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="#10B981"
          spellCheck={false}
        />
        {normalized && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-foreground/10 px-2.5 py-2 text-xs text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            {clearLabel}
          </button>
        ) : null}
      </div>
      {hint ? (
        <p className="text-xs text-foreground/45">{hint}</p>
      ) : null}
    </div>
  );
}
