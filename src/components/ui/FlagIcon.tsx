import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

type FlagIconProps = {
  locale: Locale;
  className?: string;
};

export function FlagIcon({ locale, className }: FlagIconProps) {
  if (locale === "id") {
    return (
      <svg
        viewBox="0 0 18 12"
        className={cn("shrink-0 rounded-[2px] border border-black/10", className)}
        aria-hidden
      >
        <rect width="18" height="6" fill="#E70011" />
        <rect y="6" width="18" height="6" fill="#FFFFFF" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 18 12"
      className={cn("shrink-0 rounded-[2px] border border-black/10", className)}
      aria-hidden
    >
      <rect width="18" height="12" fill="#B22234" />
      <rect y="1" width="18" height="1" fill="#FFFFFF" />
      <rect y="3" width="18" height="1" fill="#FFFFFF" />
      <rect y="5" width="18" height="1" fill="#FFFFFF" />
      <rect y="7" width="18" height="1" fill="#FFFFFF" />
      <rect y="9" width="18" height="1" fill="#FFFFFF" />
      <rect y="11" width="18" height="1" fill="#FFFFFF" />
      <rect width="8" height="7" fill="#3C3B6E" />
    </svg>
  );
}
