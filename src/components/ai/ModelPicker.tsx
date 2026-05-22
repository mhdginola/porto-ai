"use client";

import { Check, ChevronDown, Cpu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  availableChatModels,
  type ChatProvider,
  type ModelOption,
} from "@/lib/ai-models";
import { cn } from "@/lib/utils";

const BADGE_STYLES: Record<NonNullable<ModelOption["badge"]>, string> = {
  default: "bg-primary-soft text-primary-text border-primary/30",
  fast: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
  reasoning:
    "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400",
  preview:
    "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400",
  premium:
    "bg-pink-500/10 text-pink-600 border-pink-500/30 dark:text-pink-400",
};

type ModelPickerProps = {
  provider: ChatProvider;
  value: string;
  onChange: (modelId: string) => void;
  size?: "sm" | "md";
  align?: "left" | "right";
};

export function ModelPicker({
  provider,
  value,
  onChange,
  size = "sm",
  align = "left",
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const models = availableChatModels[provider] ?? [];
  const current = models.find((m) => m.id === value) ?? models[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  if (!current) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-foreground/15 bg-foreground/[0.02] font-medium transition-colors hover:bg-foreground/5",
          size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
        )}
      >
        <span className="relative shrink-0">
          <Cpu className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
          <span
            className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary-text ring-1 ring-background"
            aria-hidden
          />
        </span>
        <span className="truncate">{current.label}</span>
        <ChevronDown
          className={cn(
            "transition-transform",
            size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 min-w-[280px] overflow-hidden rounded-lg border border-foreground/15 bg-background shadow-xl",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="border-b border-foreground/10 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/50">
              {provider} models
            </p>
          </div>
          <ul className="max-h-80 overflow-y-auto p-1">
            {models.map((m) => {
              const active = m.id === value;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-foreground/5",
                      active && "bg-foreground/5"
                    )}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0 transition-opacity",
                        active ? "opacity-100 text-primary-text" : "opacity-0"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">
                          {m.label}
                        </p>
                        {active && (
                          <span className="shrink-0 rounded-full border border-primary/30 bg-primary-soft px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide text-primary-text">
                            Active
                          </span>
                        )}
                        {m.badge && (
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide",
                              BADGE_STYLES[m.badge]
                            )}
                          >
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-foreground/60">
                        {m.description}
                      </p>
                      {m.contextWindow && (
                        <p className="mt-0.5 text-[10px] text-foreground/40">
                          {Math.round(m.contextWindow / 1000)}k context
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
