import { notFound, redirect } from "next/navigation";
import { LeadsInbox } from "@/components/admin/LeadsInbox";
import { isAdmin, isAdminEnabled } from "@/lib/admin/session";

export default async function AdminLeadsPage() {
  if (!isAdminEnabled()) notFound();
  if (!(await isAdmin())) redirect("/admin/login");
  return <LeadsInbox />;
}
