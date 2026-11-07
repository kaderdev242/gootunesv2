import type { Metadata } from "next";
import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { ...NOINDEX, title: "Espace créateur" };

export default async function CreatorSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell footer={<AuthFooterLink href="/connexion" question="Déjà un compte ?" label="Se connecter" />}>
      <h1 className="text-center text-[22px] font-semibold leading-tight text-white">Vends ta musique</h1>
      <div className="mt-10">
        <SignUpForm defaultRole={params.role === "label" ? "label" : "artist"} />
      </div>
    </AuthShell>
  );
}
