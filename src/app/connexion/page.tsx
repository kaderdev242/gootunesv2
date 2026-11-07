import type { Metadata } from "next";
import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";
import { NOINDEX } from "@/lib/seo";

export const metadata: Metadata = { ...NOINDEX, title: "Connexion" };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next || "";
  const signupHref = next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription";

  return (
    <AuthShell
      title="Connexion"
      subtitle="Retrouve ta bibliothèque, tes achats ou ton espace artiste"
      footer={
        <div className="flex flex-col gap-3">
          <AuthFooterLink href={signupHref} question="Pas encore de compte ?" label="Créer un compte" />
          <AuthFooterLink href="/inscription/createur" question="Artiste ou label ?" label="Ouvrir un espace créateur" />
        </div>
      }
    >
      {params.error ? (
        <p className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-[14px] text-red-200">
          La connexion a échoué. Réessaie.
        </p>
      ) : null}
      <SignInForm next={next} />
    </AuthShell>
  );
}
