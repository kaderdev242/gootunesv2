import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-profile";
import { creatorPath } from "@/lib/dashboard/paths";
import { FanSettingsView } from "@/components/discover/settings/FanSettingsView";
import { NOINDEX } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { ...NOINDEX, title: "Paramètres" };

export default async function FanParametresPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/connexion?next=/discover/parametres");

  const { profile } = session;
  // Les créateurs ont leurs propres paramètres dans leur espace
  if (profile.role === "artist" || profile.role === "label") {
    redirect(creatorPath(profile.role, "/parametres"));
  }

  return (
    <div className="mx-auto max-w-3xl pt-2">
      <p className="text-[12px] font-medium text-white/40">
        Compte
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
        Paramètres
      </h1>
      <p className="mt-3 text-sm text-white/50">{profile.email}</p>

      <div className="mt-10">
        <FanSettingsView profile={profile} />
      </div>
    </div>
  );
}
