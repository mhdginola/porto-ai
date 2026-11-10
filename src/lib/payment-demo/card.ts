import type { CardBrand } from "@/lib/payment-demo/billing";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function detectBrand(number: string): CardBrand {
  const n = digitsOnly(number);
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^35(2[89]|[3-8]\d)/.test(n)) return "jcb";
  return "unknown";
}

export function luhnValid(number: string): boolean {
  const n = digitsOnly(number);
  if (n.length < 12 || n.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = n.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/** "4242424242424242" → "4242 4242 4242 4242" (Amex: 4-6-5). */
export function formatCardNumber(value: string): string {
  const n = digitsOnly(value).slice(0, 19);
  if (detectBrand(n) === "amex") {
    return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** "1228" → "12 / 28" */
export function formatExpiry(value: string): string {
  const n = digitsOnly(value).slice(0, 4);
  if (n.length <= 2) return n;
  return `${n.slice(0, 2)} / ${n.slice(2)}`;
}

export function parseExpiry(
  value: string
): { month: number; year: number } | null {
  const n = digitsOnly(value);
  if (n.length !== 4) return null;
  const month = Number(n.slice(0, 2));
  const year = 2000 + Number(n.slice(2));
  if (month < 1 || month > 12) return null;
  return { month, year };
}

export function isExpired(month: number, year: number, now: Date): boolean {
  // Cards are valid through the last day of the expiry month.
  const endOfMonth = Date.UTC(year, month, 1);
  return now.getTime() >= endOfMonth;
}

export function cvcLength(brand: CardBrand): number {
  return brand === "amex" ? 4 : 3;
}

/** Magic test numbers understood by the mock gateway. */
export const TEST_CARDS = [
  { number: "4242424242424242", outcome: "success" },
  { number: "4000002500003155", outcome: "threeDs" },
  { number: "4000000000000002", outcome: "declined" },
  { number: "4000000000009995", outcome: "insufficient" },
] as const;

export type TestCardOutcome = (typeof TEST_CARDS)[number]["outcome"];

export const DEMO_OTP = "123456";

export function testCardOutcome(number: string): TestCardOutcome {
  const n = digitsOnly(number);
  return TEST_CARDS.find((c) => c.number === n)?.outcome ?? "success";
}
