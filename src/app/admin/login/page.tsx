import { notFound, redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isAdmin, isAdminEnabled } from "@/lib/admin/session";

export default async function AdminLoginPage() {
  if (!isAdminEnabled()) notFound();
  if (await isAdmin()) redirect("/admin/leads");
  return <AdminLoginForm />;
}
