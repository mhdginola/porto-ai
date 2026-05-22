import type { Metadata } from "next";
import { aiInfo } from "@/lib/ai";
import { ReviewSummarizerView } from "./ReviewSummarizerView";

export const metadata: Metadata = {
  title: "Google Maps Review Summarizer",
};

export default function GoogleMapsReviewsPage() {
  return (
    <ReviewSummarizerView
      provider={aiInfo.chatProvider}
      defaultModel={aiInfo.chatModel}
    />
  );
}
