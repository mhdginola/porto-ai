import { z } from "zod";

export const verdictValues = [
  "highly_recommended",
  "worth_trying",
  "mixed",
  "caution",
  "avoid",
] as const;

export const reviewSummarySchema = z.object({
  placeName: z.string(),
  verdict: z.enum(verdictValues),
  verdictLabel: z.string(),
  summary: z.string(),
  pros: z.array(z.string()).max(6),
  cons: z.array(z.string()).max(6),
  commonThemes: z.array(z.string()).max(5),
  recommendation: z.string(),
});

export type ReviewSummaryResult = z.infer<typeof reviewSummarySchema>;

export const VERDICT_STYLES: Record<
  (typeof verdictValues)[number],
  { badge: string; bar: string }
> = {
  highly_recommended: {
    badge:
      "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  worth_trying: {
    badge:
      "bg-primary-soft text-primary-text border-primary/30",
    bar: "bg-primary",
  },
  mixed: {
    badge:
      "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  caution: {
    badge:
      "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-300",
    bar: "bg-orange-500",
  },
  avoid: {
    badge: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300",
    bar: "bg-red-500",
  },
};
