import type { Metadata } from "next";
import { AuthDemoView } from "@/components/pages/AuthDemoView";

export const metadata: Metadata = {
  title: "Simple Auth & Roles Demo",
  description:
    "Login demo with admin, editor, and viewer roles — JWT session cookies and RBAC UI.",
};

export default function AuthDemoPage() {
  return <AuthDemoView />;
}
