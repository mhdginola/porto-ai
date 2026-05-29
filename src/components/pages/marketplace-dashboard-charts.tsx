"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

const CHART_H = 140;
const CHART_W = 400;
const PAD = { top: 12, right: 8, bottom: 28, left: 8 };

function scalePoints(values: number[], width: number, height: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  return values.map((v, i) => ({
    x: PAD.left + (i / (values.length - 1 || 1)) * innerW,
    y: PAD.top + innerH - ((v - min) / range) * innerH,
  }));
}

function toPath(points: { x: number; y: number }[], close = false) {
  if (points.length === 0) return "";
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  if (!close) return line;
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${CHART_H - PAD.bottom} L ${first.x} ${CHART_H - PAD.bottom} Z`;
}

type RevenueAreaChartProps = {
  data: { label: string; value: number }[];
  className?: string;
};

export function RevenueAreaChart({ data, className }: RevenueAreaChartProps) {
  const values = data.map((d) => d.value);
  const points = scalePoints(values, CHART_W, CHART_H);
  const linePath = toPath(points);
  const areaPath = toPath(points, true);

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="h-full w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="revenue-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="revenue-line-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="50%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <filter id="revenue-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={PAD.left}
            x2={CHART_W - PAD.right}
            y1={PAD.top + (CHART_H - PAD.top - PAD.bottom) * ratio}
            y2={PAD.top + (CHART_H - PAD.top - PAD.bottom) * ratio}
            stroke="currentColor"
            strokeOpacity="0.06"
            strokeDasharray="4 6"
          />
        ))}
        <motion.path
          d={areaPath}
          fill="url(#revenue-area-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <motion.path
          d={linePath}
          fill="none"
          stroke="url(#revenue-line-stroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#revenue-glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {points.map((p, i) => (
          <motion.circle
            key={data[i].label}
            cx={p.x}
            cy={p.y}
            r="4"
            className="fill-background stroke-primary"
            strokeWidth="2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.08 }}
          />
        ))}
      </svg>
    </div>
  );
}

export function Sparkline({
  values,
  positive = true,
  className,
}: {
  values: number[];
  positive?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `spark-${uid}`;
  const w = 88;
  const h = 32;
  const points = scalePoints(values, w, h);
  const path = toPath(points);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-9 w-full min-w-0 opacity-90", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={positive ? "#4ade80" : "#f87171"} stopOpacity="0.3" />
          <stop offset="100%" stopColor={positive ? "var(--primary)" : "#ef4444"} />
        </linearGradient>
      </defs>
      <path
        d={`${path} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`}
        fill={`url(#${gradId})`}
        fillOpacity="0.35"
      />
      <path
        d={path}
        fill="none"
        stroke={positive ? "var(--primary)" : "#f87171"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const CATEGORY_COLORS = [
  { stroke: "#22c55e", glow: "rgba(34,197,94,0.35)" },
  { stroke: "#10b981", glow: "rgba(16,185,129,0.35)" },
  { stroke: "#3b82f6", glow: "rgba(59,130,246,0.35)" },
  { stroke: "#f59e0b", glow: "rgba(245,158,11,0.35)" },
  { stroke: "#a855f7", glow: "rgba(168,85,247,0.35)" },
];

export function CategoryDonut({
  categories,
}: {
  categories: { name: string; share: number }[];
}) {
  const r = 42;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative mx-auto h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeWidth="10"
        />
        {categories.map((cat, i) => {
          const len = (cat.share / 100) * circumference;
          const dash = `${len} ${circumference - len}`;
          const el = (
            <motion.circle
              key={cat.name}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length].stroke}
              strokeWidth="10"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: dash }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: "easeOut" }}
              style={{
                filter: `drop-shadow(0 0 6px ${CATEGORY_COLORS[i % CATEGORY_COLORS.length].glow})`,
              }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tabular-nums tracking-tight">5</span>
        <span className="text-[9px] font-medium uppercase tracking-widest text-foreground/45">
          categories
        </span>
      </div>
    </div>
  );
}
