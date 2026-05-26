import type { Metadata } from "next";
import { WorkView } from "@/components/pages/WorkView";

export const metadata: Metadata = {
  title: "Client work",
  description:
    "Selected client and internal projects — fintech, compliance, blockchain, and enterprise systems.",
};

export default function WorkPage() {
  return <WorkView />;
}
