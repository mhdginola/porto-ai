import type { Metadata } from "next";
import { aiInfo } from "@/lib/ai";
import { SentimentView } from "./SentimentView";

export const metadata: Metadata = { title: "Sentiment Analyzer" };

export default function SentimentPage() {
  return (
    <SentimentView
      provider={aiInfo.chatProvider}
      defaultModel={aiInfo.chatModel}
    />
  );
}
