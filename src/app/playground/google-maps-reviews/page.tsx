import type { Metadata } from "next";
import { getDefaultModelRef } from "@/lib/ai";
import { ReviewSummarizerView } from "./ReviewSummarizerView";

export const metadata: Metadata = {
  title: "Google Maps Review Summarizer",
};

export default function GoogleMapsReviewsPage() {
  return <ReviewSummarizerView defaultModelRef={getDefaultModelRef()} />;
}
