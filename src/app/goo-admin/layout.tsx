import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminSidebarCounts } from "@/lib/admin/queries";
import { NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = NOINDEX;

export default async function GooAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/connexion?next=/goo-admin");

  const counts = await getAdminSidebarCounts();

  return (
    <AdminShell profile={admin.profile} counts={counts}>
      {children}
    </AdminShell>
  );
}
