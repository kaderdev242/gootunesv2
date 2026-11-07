import type { Metadata } from "next";
import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { NOINDEX } from "@/lib/seo";
import { images } from "@/lib/images";

export const metadata: Metadata = { ...NOINDEX, title: "Espace créateur" };

export default async function CreatorSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Vendre ta musique"
      subtitle="Publie tes sorties, fixe tes prix et reçois tes ventes par Mobile Money"
      image={images.studioMic}
      caption="Ton catalogue, tes prix, tes fans"
      footer={
        <div className="flex flex-col gap-3">
          <AuthFooterLink href="/connexion" question="Déjà inscrit ?" label="Se connecter" />
          <AuthFooterLink href="/inscription" question="Tu veux juste écouter ?" label="Créer un compte fan" />
        </div>
      }
    >
      <SignUpForm defaultRole={params.role === "label" ? "label" : "artist"} />
    </AuthShell>
  );
}
