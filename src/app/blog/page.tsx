import type { Metadata } from "next";
import { BlogView } from "@/components/pages/BlogView";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return <BlogView />;
}
