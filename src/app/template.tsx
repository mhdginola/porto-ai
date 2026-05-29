import { PageTransition } from "@/components/layout/PageTransition";

export default function RootTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
