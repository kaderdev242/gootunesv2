import { redirect } from "next/navigation";
import { getSessionProfile, homeForProfile } from "@/lib/auth/get-profile";

/** Compat : /dashboard → /artist ou /label */
export default async function DashboardRedirectPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/connexion?next=/artist");
  redirect(homeForProfile(session.profile));
}
