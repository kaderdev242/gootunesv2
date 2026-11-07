import type { Metadata } from "next";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { ...NOINDEX, title: "Connexion" };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      footer={<AuthFooterLink href="/inscription/createur" question="Artiste ou label ?" label="Ouvrir un espace créateur" />}
    >
      {params.error ? (
        <p className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-[14px] text-red-200">
          La connexion a échoué. Réessaie.
        </p>
      ) : null}
      <AuthFlow next={params.next || ""} />
    </AuthShell>
  );
}
