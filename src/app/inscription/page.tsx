import { redirect } from "next/navigation";

/** L'inscription fan passe par le même parcours que la connexion. */
export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string }>;
}) {
  const params = await searchParams;
  if (params.role === "artist" || params.role === "label") {
    redirect(`/inscription/createur?role=${params.role}`);
  }
  redirect(params.next ? `/connexion?next=${encodeURIComponent(params.next)}` : "/connexion");
}
