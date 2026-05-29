"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { KpiDisplay } from "@/lib/format-idr";
import { cn } from "@/lib/utils";

function ChangeBadge({ value }: { value: number }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        up ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-400"
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {up ? "+" : "−"}
      {Math.abs(value)}%
    </span>
  );
}

function KpiHeadline({ display }: { display: KpiDisplay }) {
  const { headline } = display;
  if (headline.kind === "plain") {
    return (
      <p className="text-[1.65rem] font-semibold leading-tight tracking-tight tabular-nums text-foreground sm:text-[1.85rem]">
        {headline.value}
      </p>
    );
  }
  return (
    <p className="whitespace-nowrap leading-tight tabular-nums">
      {headline.prefix ? (
        <span className="mr-1.5 text-base font-medium text-foreground/45 sm:text-lg">
          {headline.prefix}
        </span>
      ) : null}
      <span className="text-[1.65rem] font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
        {headline.value}
      </span>
      {headline.suffix ? (
        <span className="ml-1.5 text-base font-medium text-foreground/45 sm:text-lg">
          {headline.suffix}
        </span>
      ) : null}
    </p>
  );
}

export type MarketplaceStatCardProps = {
  label: string;
  display: KpiDisplay;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  barClass: string;
  index: number;
};

export function MarketplaceStatCard({
  label,
  display,
  change,
  icon: Icon,
  barClass,
  index,
}: MarketplaceStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="group relative rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4 transition-colors hover:border-foreground/20 hover:bg-foreground/[0.05]"
    >
      <div
        className={cn("absolute inset-y-3 left-0 w-[3px] rounded-r-full", barClass)}
        aria-hidden
      />

      <p className="pl-2 text-xs font-medium leading-snug text-foreground/55">
        {label}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2 pl-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06] text-foreground/50 transition-colors group-hover:text-primary-text">
          <Icon className="h-4 w-4" />
        </span>
        <ChangeBadge value={change} />
      </div>

      <div className="mt-3 pl-2">
        <KpiHeadline display={display} />
        <p className="mt-1.5 text-xs leading-snug text-foreground/40">
          {display.caption}
        </p>
      </div>
    </motion.div>
  );
}
