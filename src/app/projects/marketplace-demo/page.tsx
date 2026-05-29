import type { Metadata } from "next";
import { MarketplaceDashboardDemo } from "@/components/pages/MarketplaceDashboardDemo";

export const metadata: Metadata = {
  title: "Marketplace SaaS Dashboard",
  description:
    "Demo seller dashboard with hardcoded products, orders, and revenue charts.",
};

export default function MarketplaceDemoPage() {
  return <MarketplaceDashboardDemo />;
}
