import type { Metadata } from "next";
import { AgentView } from "./AgentView";

export const metadata: Metadata = { title: "Ask the Agent" };

export default function AgentPage() {
  return <AgentView />;
}
