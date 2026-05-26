import type { Metadata } from "next";
import { CrudDemoView } from "@/components/pages/CrudDemoView";

export const metadata: Metadata = {
  title: "Simple CRUD Demo",
  description:
    "Live Create, Read, Update, Delete demo with Next.js API routes and PostgreSQL.",
};

export default function CrudDemoPage() {
  return <CrudDemoView />;
}
