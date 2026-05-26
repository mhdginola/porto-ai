"use client";

import { Check, ChevronDown, Cpu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type ChatProvider,
  type ModelGroup,
} from "@/lib/ai-models";
import { encodeModelRef, findModelInGroups } from "@/lib/chat-model-ref";
import { cn } from "@/lib/utils";

const BADGE_STYLES: Record<string, string> = {
  default: "bg-primary-soft text-primary-text border-primary/30",
  fast: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400",
  reasoning:
    "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400",
  preview:
    "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400",
  premium:
    "bg-pink-500/10 text-pink-600 border-pink-500/30 dark:text-pink-400",
  local:
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
};

const PROVIDER_LABEL: Record<ChatProvider, string> = {
  groq: "Groq",
  openai: "OpenAI",
  ollama: "Ollama",
};

type ModelPickerProps = {
  value: string;
  onChange: (modelRef: string) => void;
  groups: ModelGroup[];
  size?: "sm" | "md";
  align?: "left" | "right";
};

export function ModelPicker({
  value,
  onChange,
  groups,
  size = "sm",
  align = "left",
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = findModelInGroups(value, groups);
  const firstAvailable = groups.find(
    (g) => g.available && g.models.length > 0
  );

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

  if (!current && !firstAvailable) return null;

  const label = current?.label ?? "Model";
  const providerLabel = current
    ? PROVIDER_LABEL[current.provider]
    : "";

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
        <span className="truncate max-w-[10rem] sm:max-w-[14rem]">
          {label}
        </span>
        <ChevronDown
          className={cn(
            "transition-transform shrink-0",
            size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1.5 min-w-[300px] overflow-hidden rounded-lg border border-foreground/15 bg-background shadow-xl",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="border-b border-foreground/10 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/50">
              Chat models
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto p-1">
            {groups.map((group) => (
              <div key={group.provider} className="mb-1 last:mb-0">
                <p className="sticky top-0 z-10 bg-background/95 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45 backdrop-blur-sm">
                  {PROVIDER_LABEL[group.provider]}
                  {!group.available && (
                    <span className="ml-1.5 font-normal normal-case text-amber-600 dark:text-amber-400">
                      (offline)
                    </span>
                  )}
                </p>
                <ul>
                  {group.models.map((m) => {
                    const refForModel = encodeModelRef(group.provider, m.id);
                    const active = value === refForModel;
                    const disabled = !group.available;
                    return (
                      <li key={`${group.provider}:${m.id}`}>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (disabled) return;
                            onChange(refForModel);
                            setOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors",
                            disabled
                              ? "cursor-not-allowed opacity-45"
                              : "hover:bg-foreground/5",
                            active && !disabled && "bg-foreground/5"
                          )}
                        >
                          <Check
                            className={cn(
                              "mt-0.5 h-3.5 w-3.5 shrink-0 transition-opacity",
                              active && !disabled
                                ? "opacity-100 text-primary-text"
                                : "opacity-0"
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-sm font-medium">{m.label}</p>
                              {active && !disabled && (
                                <span className="shrink-0 rounded-full border border-primary/30 bg-primary-soft px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide text-primary-text">
                                  Active
                                </span>
                              )}
                              {m.badge && (
                                <span
                                  className={cn(
                                    "shrink-0 rounded-full border px-1.5 py-0 text-[9px] font-medium uppercase tracking-wide",
                                    BADGE_STYLES[m.badge] ??
                                      BADGE_STYLES.default
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
            ))}
          </div>
        </div>
      )}
      {current && providerLabel && size === "md" && (
        <span className="sr-only">
          {label} via {providerLabel}
        </span>
      )}
    </div>
  );
}
