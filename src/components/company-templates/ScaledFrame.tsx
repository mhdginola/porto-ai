"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Live, non-interactive thumbnail: renders the page in an iframe at desktop width
 * and scales it down to fit the card (so the desktop layout is what you see).
 */
export function ScaledFrame({
  src,
  title,
  frameWidth = 1280,
  frameHeight = 800,
  className,
}: {
  src: string;
  title: string;
  frameWidth?: number;
  frameHeight?: number;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / frameWidth);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [frameWidth]);

  return (
    <div
      ref={box}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: `${frameWidth} / ${frameHeight}` }}
    >
      <iframe
        src={src}
        title={title}
        loading="lazy"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
        style={{ width: frameWidth, height: frameHeight, transform: `scale(${scale})` }}
      />
    </div>
  );
}
