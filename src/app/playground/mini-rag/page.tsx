import type { Metadata } from "next";
import { aiInfo } from "@/lib/ai";
import { MiniRagView } from "./MiniRagView";

export const metadata: Metadata = { title: "Mini RAG · Chat with your PDF" };

export default function MiniRagPage() {
  return (
    <MiniRagView
      provider={aiInfo.chatProvider}
      defaultModel={aiInfo.chatModel}
    />
  );
}
