import { DiscoverShell } from "@/components/feed/DiscoverShell";
import { getSessionProfile } from "@/lib/auth/get-profile";
import { getRecentPlaylists } from "@/lib/playlists/queries";

export async function DiscoverAppFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionProfile();
  const recentPlaylists = session?.userId
    ? await getRecentPlaylists(session.userId, 3)
    : [];

  return (
    <DiscoverShell
      profile={session?.profile ?? null}
      recentPlaylists={recentPlaylists}
    >
      {children}
    </DiscoverShell>
  );
}
