import type { Metadata } from "next";
import { ProjectsView } from "@/components/pages/ProjectsView";

export const metadata: Metadata = {
  title: "Public projects",
  description:
    "Open portfolio projects, demos, and experiments with live links and source code.",
};

export default function ProjectsPage() {
  return <ProjectsView />;
}
