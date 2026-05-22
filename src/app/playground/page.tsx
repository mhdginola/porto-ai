import type { Metadata } from "next";
import { PlaygroundView } from "@/components/pages/PlaygroundView";

export const metadata: Metadata = { title: "AI Playground" };

export default function PlaygroundPage() {
  return <PlaygroundView />;
}
