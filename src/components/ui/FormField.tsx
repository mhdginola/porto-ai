"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function FormField({
  id,
  label,
  error,
  hint,
  className,
  ...inputProps
}: FormFieldProps) {
  const describedBy = error
    ? `${id}-error`
    : hint
      ? `${id}-hint`
      : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-xs font-medium text-foreground/60">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          inputClass,
          error
            ? "border-red-500/70 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            : "border-foreground/15 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        )}
        {...inputProps}
      />
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11px] text-foreground/45">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
