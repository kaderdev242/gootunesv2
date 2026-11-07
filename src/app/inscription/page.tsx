import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { RoleSignUpForm } from "@/components/auth/RoleSignUpForm";
import { NOINDEX } from "@/lib/seo";
import { images } from "@/lib/images";

export const metadata: Metadata = { ...NOINDEX, title: "Créer un compte" };

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string }>;
}) {
  const params = await searchParams;

  // Anciens liens « ?role=artist|label » : page créateur.
  if (params.role === "artist" || params.role === "label") {
    redirect(`/inscription/createur?role=${params.role}`);
  }

  const next = params.next || "";
  const signinHref = next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion";

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Achète la musique de tes artistes et garde-la dans ta bibliothèque"
      image={images.crowdWarm}
      caption="Chaque achat va directement à l'artiste"
      footer={
        <div className="flex flex-col gap-3">
          <AuthFooterLink href={signinHref} question="Déjà un compte ?" label="Se connecter" />
          <AuthFooterLink href="/inscription/createur" question="Artiste ou label ?" label="Ouvrir un espace créateur" />
        </div>
      }
    >
      <RoleSignUpForm role="fan" compact next={next} />
    </AuthShell>
  );
}
