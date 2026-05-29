"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/layout/LocaleProvider";

function isModifiedClick(e: MouseEvent) {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

function shouldStartNavigation(anchor: HTMLAnchorElement, pathname: string) {
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:")) return false;

  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    const current = `${pathname}${window.location.search}`;
    const next = `${url.pathname}${url.search}`;
    return next !== current;
  } catch {
    return false;
  }
}

export function NavigationProgress() {
  const { t } = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (completeRef.current) clearTimeout(completeRef.current);
    tickRef.current = null;
    completeRef.current = null;
  }, []);

  const startNavigation = useCallback(() => {
    if (reduceMotion) return;
    clearTimers();
    setActive(true);
    setProgress(12);
    tickRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 88) return p;
        return p + 4 + Math.random() * 10;
      });
    }, 160);
  }, [clearTimers, reduceMotion]);

  const finishNavigation = useCallback(() => {
    clearTimers();
    setProgress(100);
    completeRef.current = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 280);
  }, [clearTimers]);

  useEffect(() => {
    finishNavigation();
  }, [pathname, searchParams, finishNavigation]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (isModifiedClick(e)) return;
      const anchor = (e.target as Element).closest("a");
      if (!anchor || !shouldStartNavigation(anchor, pathname)) return;
      startNavigation();
    };

    const onPopState = () => startNavigation();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
  }, [pathname, startNavigation, clearTimers]);

  if (reduceMotion) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[90] bg-background/25 backdrop-blur-[1px]"
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden bg-foreground/5"
      >
        <motion.div
          className="relative h-full origin-left bg-gradient-to-r from-primary/40 via-primary to-primary-text shadow-[0_0_16px_var(--primary)]"
          initial={false}
          animate={{
            width: active || progress > 0 ? `${progress}%` : "0%",
            opacity: active || progress > 0 ? 1 : 0,
          }}
          transition={{
            width: { type: "spring", stiffness: 120, damping: 22 },
            opacity: { duration: 0.2 },
          }}
        >
          <span className="nav-progress-shimmer absolute inset-0" />
        </motion.div>
      </div>

      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-14 z-[100] -translate-x-1/2"
        initial={false}
        animate={{
          opacity: active ? 1 : 0,
          scale: active ? 1 : 0.85,
          y: active ? 0 : -6,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-2 rounded-full border border-primary/25 bg-background/90 px-3 py-1.5 text-[11px] font-medium text-primary-text shadow-lg backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-primary" />
          </span>
          {t("nav.pageLoading")}
        </div>
      </motion.div>
    </>
  );
}
