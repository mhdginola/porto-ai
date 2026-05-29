"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/ai/ChatWidget";
import { usePropertyAgencyPreview } from "@/components/layout/PropertyAgencyPreviewProvider";

type Props = {
  children: React.ReactNode;
  defaultModelRef: string;
};

export function PortfolioShell({ children, defaultModelRef }: Props) {
  const { active: previewActive } = usePropertyAgencyPreview();

  return (
    <>
      {!previewActive ? <Navbar /> : null}
      <main className="flex-1">{children}</main>
      {!previewActive ? <Footer /> : null}
      {!previewActive ? (
        <ChatWidget defaultModelRef={defaultModelRef} />
      ) : null}
    </>
  );
}
