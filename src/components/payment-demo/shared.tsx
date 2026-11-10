import type { CardBrand } from "@/lib/payment-demo/billing";
import { cn } from "@/lib/utils";

const BRAND_LABEL: Record<CardBrand, string> = {
  visa: "VISA",
  mastercard: "MC",
  amex: "AMEX",
  jcb: "JCB",
  unknown: "CARD",
};

const BRAND_STYLE: Record<CardBrand, string> = {
  visa: "bg-blue-600 text-white",
  mastercard: "bg-orange-500 text-white",
  amex: "bg-sky-500 text-white",
  jcb: "bg-emerald-600 text-white",
  unknown: "bg-foreground/10 text-foreground/50",
};

export function BrandMark({
  brand,
  className,
}: {
  brand: CardBrand;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-9 items-center justify-center rounded px-1.5 text-[9px] font-bold italic tracking-wider",
        BRAND_STYLE[brand],
        className
      )}
    >
      {BRAND_LABEL[brand]}
    </span>
  );
}

export function formatDay(iso: string, locale: "en" | "id") {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, locale: "en" | "id") {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}
