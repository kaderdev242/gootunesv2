import { listPlaylistsAdmin } from "@/lib/admin/queries";
import { AdminPlaylistsView } from "@/components/admin/AdminPlaylistsView";

export default async function AdminPlaylistsPage() {
  const playlists = await listPlaylistsAdmin();
  return <AdminPlaylistsView playlists={playlists} />;
}
