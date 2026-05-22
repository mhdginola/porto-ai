import type { Metadata } from "next";
import { aiInfo } from "@/lib/ai";
import { SummarizerView } from "./SummarizerView";

export const metadata: Metadata = { title: "Text Summarizer" };

export default function SummarizerPage() {
  return (
    <SummarizerView
      provider={aiInfo.chatProvider}
      defaultModel={aiInfo.chatModel}
    />
  );
}
