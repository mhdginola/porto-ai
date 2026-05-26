import type { Metadata } from "next";
import { getDefaultModelRef } from "@/lib/ai";
import { SentimentView } from "./SentimentView";

export const metadata: Metadata = { title: "Sentiment Analysis" };

export default function SentimentPage() {
  return <SentimentView defaultModelRef={getDefaultModelRef()} />;
}
