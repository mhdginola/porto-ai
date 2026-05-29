import type { CSSProperties } from "react";

export function normalizeHex(input?: string): string | null {
  if (!input) return null;
  const s = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s.toLowerCase()}`;
  return null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.slice(1);
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`;
}

function mixHex(hex: string, target: { r: number; g: number; b: number }, amount: number) {
  const rgb = hexToRgb(hex);
  return rgbToHex(
    rgb.r + (target.r - rgb.r) * amount,
    rgb.g + (target.g - rgb.g) * amount,
    rgb.b + (target.b - rgb.b) * amount
  );
}

export function darkenHex(hex: string, amount: number): string {
  return mixHex(hex, { r: 0, g: 0, b: 0 }, amount);
}

export function lightenHex(hex: string, amount: number): string {
  return mixHex(hex, { r: 255, g: 255, b: 255 }, amount);
}

export function buildThemeStyleVars(customColor: string): CSSProperties {
  const hex = normalizeHex(customColor);
  if (!hex) return {};

  return {
    "--pa-accent": hex,
    "--pa-accent-hover": lightenHex(hex, 0.12),
    "--pa-accent-text": lightenHex(hex, 0.32),
    "--pa-hero-from": darkenHex(hex, 0.72),
    "--pa-hero-via": darkenHex(hex, 0.55),
  } as CSSProperties;
}
