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
  // Admin pages, the agency-site preview and template previews (/templates/<slug>…)
  // render without the portfolio chrome. The /templates catalog keeps it.
  const bare =
    previewActive || pathname.startsWith("/admin") || /^\/templates\/[^/]+/.test(pathname);

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
