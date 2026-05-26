import type { Metadata } from "next";
import { getDefaultModelRef } from "@/lib/ai";
import { SummarizerView } from "./SummarizerView";

export const metadata: Metadata = { title: "Summarizer" };

export default function SummarizerPage() {
  return <SummarizerView defaultModelRef={getDefaultModelRef()} />;
}
