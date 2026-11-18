"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Run `onVisible` once when the element scrolls into view. */
function useOnceVisible<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/** Fade/slide content in on scroll (skipped for users who prefer reduced motion). */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useOnceVisible<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out",
        visible ? "translate-y-0 opacity-100" : "motion-safe:translate-y-6 motion-safe:opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Animate the number inside values like "15+", "1,2 jt m²", "99,2%", "4.200+"
 * (Indonesian formatting: dot = thousands, comma = decimals).
 */
export function CountUp({ value, duration = 1400 }: { value: string; duration?: number }) {
  const match = value.match(/^([^\d]*)([\d.,]+)(.*)$/);
  const { ref, visible } = useOnceVisible<HTMLSpanElement>(0.4);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!visible || !match) return;
    const [, prefix, numText, suffix] = match;
    const decimals = numText.includes(",") ? numText.split(",")[1].length : 0;
    const target = Number(numText.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(target) || target === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const fmt = new Intl.NumberFormat("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const useGrouping = numText.includes(".") || target < 1000;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const n = target * eased;
      const text = useGrouping ? fmt.format(n) : n.toFixed(decimals).replace(".", ",");
      setShown(p < 1 ? `${prefix}${text}${suffix}` : value);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // match is derived from value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown}
    </span>
  );
}
