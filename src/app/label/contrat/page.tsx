import { redirect } from "next/navigation";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { CreatorContractPage } from "@/components/contracts/CreatorContractPage";

export default async function LabelContratPage() {
  const session = await requireCreatorProfile("label");
  if (!session) redirect("/connexion?next=/label/contrat");
  return <CreatorContractPage userId={session.userId} profile={session.profile} />;
}
