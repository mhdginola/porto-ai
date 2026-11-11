import type { Metadata } from "next";
import { AuthDemoView } from "@/components/pages/AuthDemoView";

export const metadata: Metadata = {
  title: "Simple Auth & Roles Demo",
  description:
    "Login demo with admin, editor, and viewer roles — JWT session cookies, RBAC, plan entitlements, and Sign-In with Ethereum with an on-chain token gate.",
};

export default function AuthDemoPage() {
  return <AuthDemoView />;
}
