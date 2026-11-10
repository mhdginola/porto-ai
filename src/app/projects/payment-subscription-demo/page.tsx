import type { Metadata } from "next";
import { PaymentSubscriptionDemoView } from "@/components/pages/PaymentSubscriptionDemoView";
import { isXenditEnabled } from "@/lib/payment-demo/xendit";

export const metadata: Metadata = {
  title: "Payment & Subscription Demo",
  description:
    "SaaS billing demo: pricing plans, checkout, proration, invoices, and webhooks — with a built-in simulator and a Xendit (test mode) integration.",
};

export default function PaymentSubscriptionDemoPage() {
  return <PaymentSubscriptionDemoView xenditEnabled={isXenditEnabled()} />;
}
