import { z } from "zod";

export const verdictValues = ["strong", "good", "partial", "stretch"] as const;

export type Verdict = (typeof verdictValues)[number];

export const fitCheckSchema = z.object({
  role: z.object({
    title: z.string(),
    seniority: z.string().optional(),
  }),
  matchScore: z.number().min(0).max(100),
  verdict: z.enum(verdictValues),
  summary: z.string(),
  strengths: z
    .array(
      z.object({
        point: z.string(),
        evidence: z.string(),
      })
    )
    .max(5),
  gaps: z
    .array(
      z.object({
        point: z.string(),
        mitigation: z.string().optional(),
      })
    )
    .max(4),
  keyTech: z.array(z.string()).max(8),
  pitch: z.string(),
});

export type FitCheckResult = z.infer<typeof fitCheckSchema>;

/** Score-band styling for the verdict badge + score bar. */
export const VERDICT_STYLES: Record<
  Verdict,
  { bar: string; badge: string }
> = {
  strong: {
    bar: "bg-emerald-500",
    badge:
      "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  },
  good: {
    bar: "bg-primary",
    badge: "bg-primary-soft text-primary-text border-primary/30",
  },
  partial: {
    bar: "bg-amber-400",
    badge:
      "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  },
  stretch: {
    bar: "bg-rose-500",
    badge: "bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300",
  },
};

/** Map a 0–100 score to a verdict band (fallback while the field streams in). */
export function scoreToVerdict(score: number): Verdict {
  if (score >= 80) return "strong";
  if (score >= 60) return "good";
  if (score >= 40) return "partial";
  return "stretch";
}
