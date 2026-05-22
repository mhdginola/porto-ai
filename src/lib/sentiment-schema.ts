import { z } from "zod";

export const emotionValues = [
  "joy",
  "sadness",
  "anger",
  "fear",
  "surprise",
  "disgust",
  "neutral",
  "mixed",
  "excitement",
] as const;

export const intentValues = [
  "question",
  "complaint",
  "praise",
  "request",
  "information",
  "purchase",
  "support",
  "feedback",
  "urgency",
  "other",
] as const;

export const sentimentSchema = z.object({
  emotion: z.object({
    primary: z.enum(emotionValues),
    label: z.string(),
    confidence: z.number().min(0).max(1),
    tone: z.string(),
  }),
  intent: z.object({
    primary: z.enum(intentValues),
    label: z.string(),
    confidence: z.number().min(0).max(1),
    goal: z.string(),
  }),
  summary: z.string(),
  keywords: z.array(z.string()).max(6),
});

export type SentimentResult = z.infer<typeof sentimentSchema>;

export const EMOTION_STYLES: Record<
  (typeof emotionValues)[number],
  { bar: string; badge: string }
> = {
  joy: {
    bar: "bg-amber-400",
    badge: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
  },
  excitement: {
    bar: "bg-orange-400",
    badge: "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-300",
  },
  sadness: {
    bar: "bg-blue-400",
    badge: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300",
  },
  anger: {
    bar: "bg-red-500",
    badge: "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300",
  },
  fear: {
    bar: "bg-purple-400",
    badge: "bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-300",
  },
  surprise: {
    bar: "bg-cyan-400",
    badge: "bg-cyan-500/15 text-cyan-700 border-cyan-500/30 dark:text-cyan-300",
  },
  disgust: {
    bar: "bg-lime-600",
    badge: "bg-lime-500/15 text-lime-800 border-lime-500/30 dark:text-lime-300",
  },
  neutral: {
    bar: "bg-foreground/40",
    badge: "bg-foreground/10 text-foreground/70 border-foreground/20",
  },
  mixed: {
    bar: "bg-primary",
    badge: "bg-primary-soft text-primary-text border-primary/30",
  },
};

export const INTENT_STYLES: Record<
  (typeof intentValues)[number],
  { badge: string }
> = {
  question: {
    badge: "bg-blue-500/10 text-blue-700 border-blue-500/25 dark:text-blue-300",
  },
  complaint: {
    badge: "bg-red-500/10 text-red-700 border-red-500/25 dark:text-red-300",
  },
  praise: {
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-300",
  },
  request: {
    badge: "bg-violet-500/10 text-violet-700 border-violet-500/25 dark:text-violet-300",
  },
  information: {
    badge: "bg-slate-500/10 text-slate-700 border-slate-500/25 dark:text-slate-300",
  },
  purchase: {
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-300",
  },
  support: {
    badge: "bg-cyan-500/10 text-cyan-700 border-cyan-500/25 dark:text-cyan-300",
  },
  feedback: {
    badge: "bg-indigo-500/10 text-indigo-700 border-indigo-500/25 dark:text-indigo-300",
  },
  urgency: {
    badge: "bg-orange-500/10 text-orange-700 border-orange-500/25 dark:text-orange-300",
  },
  other: {
    badge: "bg-foreground/10 text-foreground/70 border-foreground/20",
  },
};
