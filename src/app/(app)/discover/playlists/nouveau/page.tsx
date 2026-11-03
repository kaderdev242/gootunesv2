import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlaylistForm } from "@/components/discover/PlaylistForm";

export const dynamic = "force-dynamic";

export default async function NouvellePlaylistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion?next=/discover/playlists/nouveau");
  }

  return (
    <div className="mx-auto max-w-lg pb-12">
      <Link
        href="/discover/playlists"
        className="text-sm text-white/45 transition hover:text-white"
      >
        ← Mes playlists
      </Link>
      <header className="mt-6 mb-6">
        <h1 className="font-display text-3xl font-bold text-white">
          Nouvelle playlist
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Titre, description et cover — tu pourras y ajouter des morceaux ensuite.
        </p>
      </header>
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <PlaylistForm mode="create" />
      </div>
    </div>
  );
}
