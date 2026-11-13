import { RetroPage } from "@/components/retro/RetroPage";

export default function ArtistRetroPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  return <RetroPage role="artist" searchParams={searchParams} />;
}
