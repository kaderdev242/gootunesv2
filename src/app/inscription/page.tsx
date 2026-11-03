import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import type { UserRole } from "@/lib/supabase/database.types";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = NOINDEX;

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const role = (params.role as UserRole) || "artist";

  if (role === "fan") {
    redirect("/discover");
  }

  return (
    <AuthShell
      eyebrow="Créateur"
      title="Vendre sur Gootunes"
      subtitle="Artiste ou label — crée ton compte et publie ton catalogue."
    >
      <SignUpForm defaultRole={role === "label" ? "label" : "artist"} />
    </AuthShell>
  );
}
