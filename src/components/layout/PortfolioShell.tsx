"use client";

import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  // Admin pages and the agency-site preview render without the portfolio chrome.
  const bare = previewActive || pathname.startsWith("/admin");

  return (
    <>
      {!bare ? <Navbar /> : null}
      <main className="flex-1">{children}</main>
      {!bare ? <Footer /> : null}
      {!bare ? (
        <ChatWidget defaultModelRef={defaultModelRef} />
      ) : null}
    </>
  );
}
