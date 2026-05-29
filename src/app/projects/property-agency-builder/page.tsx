import type { Metadata } from "next";
import { PropertyAgencyBuilderView } from "@/components/pages/PropertyAgencyBuilderView";

export const metadata: Metadata = {
  title: "Property Agency Website Builder",
  description:
    "Build and publish property agency websites stored in PostgreSQL. View live sites via URL hash.",
};

export default function PropertyAgencyBuilderPage() {
  return <PropertyAgencyBuilderView />;
}
