import { redirect } from "next/navigation";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { CreatorContractPage } from "@/components/contracts/CreatorContractPage";

export default async function ArtistContratPage() {
  const session = await requireCreatorProfile("artist");
  if (!session) redirect("/connexion?next=/artist/contrat");
  return <CreatorContractPage userId={session.userId} profile={session.profile} />;
}
