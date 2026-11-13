import { notFound, redirect } from "next/navigation";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { isFeatureEnabled } from "@/lib/features";
import { getCreatorRetro } from "@/lib/retro";
import { parsePeriod } from "@/lib/retro-periods";
import { RetroView } from "./RetroView";

/** Page Rétro commune aux espaces artiste et label. */
export async function RetroPage({
  role,
  searchParams,
}: {
  role: "artist" | "label";
  searchParams: Promise<{ periode?: string }>;
}) {
  const basePath = role === "label" ? "/label" : "/artist";
  const session = await requireCreatorProfile(role);
  if (!session) redirect(`/connexion?next=${basePath}/retro`);
  if (!(await isFeatureEnabled("retro"))) notFound();

  const period = parsePeriod((await searchParams).periode);
  const data = await getCreatorRetro(period);

  return (
    <RetroView
      data={data}
      period={period}
      basePath={basePath}
      name={session.profile.display_name || (role === "label" ? "Mon label" : "Artiste")}
      avatar={session.profile.avatar_url}
      isLabel={role === "label"}
    />
  );
}
