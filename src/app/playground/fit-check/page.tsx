import type { Metadata } from "next";
import { getDefaultModelRef } from "@/lib/ai";
import { FitCheckView } from "./FitCheckView";

export const metadata: Metadata = { title: "Fit Check" };

export default function FitCheckPage() {
  return <FitCheckView defaultModelRef={getDefaultModelRef()} />;
}
