"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "@/lib/i18n/types";
import {
  translate,
  type TranslationKey,
} from "@/lib/i18n/translations";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Language explicitly chosen with the toggle, or null when the visitor never chose. */
function readStoredLocale(): Locale | null {
  try {
    const saved = globalThis.localStorage.getItem(LOCALE_STORAGE_KEY);
    return saved === "id" || saved === "en" ? saved : null;
  } catch {
    return null;
  }
}

function persistLocale(locale: Locale) {
  try {
    globalThis.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* storage unavailable: the cookie still remembers the choice */
  }
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

/**
 * Language used when the visitor hasn't chosen one. The portfolio defaults to
 * English, but the company-profile template pages target Indonesian businesses,
 * so they render (server-side too) in Indonesian.
 */
function routeDefaultLocale(pathname: string | null): Locale {
  return pathname === "/templates" || pathname?.startsWith("/templates/") ? "id" : DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [chosen, setChosen] = useState<Locale | null>(null);
  const locale = chosen ?? routeDefaultLocale(pathname);

  useEffect(() => {
    const stored = readStoredLocale();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    if (stored) setChosen(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setChosen(next);
    persistLocale(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translate(locale, key),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
