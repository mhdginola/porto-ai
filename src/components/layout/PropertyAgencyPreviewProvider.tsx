"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PropertyAgencyPreviewContextValue = {
  active: boolean;
  setPreviewActive: (active: boolean) => void;
};

const PropertyAgencyPreviewContext =
  createContext<PropertyAgencyPreviewContextValue | null>(null);

export function PropertyAgencyPreviewProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [active, setActive] = useState(false);
  const setPreviewActive = useCallback((next: boolean) => {
    setActive(next);
  }, []);

  const value = useMemo(
    () => ({ active, setPreviewActive }),
    [active, setPreviewActive]
  );

  return (
    <PropertyAgencyPreviewContext.Provider value={value}>
      {children}
    </PropertyAgencyPreviewContext.Provider>
  );
}

export function usePropertyAgencyPreview() {
  const ctx = useContext(PropertyAgencyPreviewContext);
  if (!ctx) {
    throw new Error(
      "usePropertyAgencyPreview must be used within PropertyAgencyPreviewProvider"
    );
  }
  return ctx;
}
