"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type NavLink = { label: string; href: string };

/** Highlights the link of the section currently in view. */
function useActiveSection(links: NavLink[]) {
  const [active, setActive] = useState(links[0]?.href ?? "");
  useEffect(() => {
    const sections = links
      .map((l) => document.querySelector<HTMLElement>(l.href === "#top" ? "#top" : l.href))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [links]);
  return active;
}

export function SpyNav({
  links,
  className,
  linkClass,
  activeClass,
}: {
  links: NavLink[];
  className?: string;
  linkClass?: string;
  activeClass: string;
}) {
  const active = useActiveSection(links);
  return (
    <nav className={className}>
      {links.map((l) => (
        <a key={l.label} href={l.href} className={cn(linkClass, active === l.href && activeClass)} aria-current={active === l.href ? "true" : undefined}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}

/** Hamburger menu for small screens. */
export function MobileMenu({ links, dark }: { links: NavLink[]; dark: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn("flex h-10 w-10 items-center justify-center rounded-lg", dark ? "text-neutral-100 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100")}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <div
        className={cn(
          "absolute inset-x-0 top-full origin-top border-b px-6 py-3 shadow-lg transition-all duration-200",
          dark ? "border-neutral-800 bg-neutral-950" : "border-slate-200 bg-white",
          open ? "visible scale-y-100 opacity-100" : "invisible scale-y-95 opacity-0"
        )}
      >
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            onClick={() => setOpen(false)}
            className={cn("block rounded-lg px-3 py-3 font-medium", dark ? "text-neutral-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50")}
          >
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
