import { DiscoverShell } from "@/components/feed/DiscoverShell";
import { getSessionProfile } from "@/lib/auth/get-profile";
import { getRecentlyPlayed } from "@/lib/discover/queries";
import { getRecentPlaylists } from "@/lib/playlists/queries";

export const dynamic = "force-dynamic";

export default async function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile();
  const [recentPlays, recentPlaylists] = await Promise.all([
    session?.userId ? getRecentlyPlayed(session.userId, 12) : Promise.resolve([]),
    session?.userId ? getRecentPlaylists(session.userId, 3) : Promise.resolve([]),
  ]);

  return (
    <DiscoverShell
      profile={session?.profile ?? null}
      recentPlays={recentPlays}
      recentPlaylists={recentPlaylists}
    >
      {children}
    </DiscoverShell>
  );
}
