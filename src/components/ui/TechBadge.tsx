import { cn } from "@/lib/utils";
import { getTechMeta } from "@/lib/tech-icons";

type TechBadgeProps = {
  name: string;
  className?: string;
  size?: "sm" | "md";
};

export function TechBadge({ name, className, size = "sm" }: TechBadgeProps) {
  const meta = getTechMeta(name);
  const Icon = meta?.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-foreground/5 font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            "shrink-0",
            !meta?.color && "text-foreground/80",
            size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
          )}
          style={meta?.color ? { color: meta.color } : undefined}
          aria-hidden
        />
      ) : null}
      {name}
    </span>
  );
}
