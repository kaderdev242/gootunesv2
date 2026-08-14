import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      eyebrow="Bienvenue"
      title="Connexion"
      subtitle="Accède à Discover ou à ton dashboard artiste / label."
    >
      {params.error ? (
        <p className="mb-4 rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-300">
          Échec de l&apos;authentification. Réessaie.
        </p>
      ) : null}
      <SignInForm next={params.next || ""} />
    </AuthShell>
  );
}
