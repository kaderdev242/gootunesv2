import { RetroPage } from "@/components/retro/RetroPage";

export default function LabelRetroPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  return <RetroPage role="label" searchParams={searchParams} />;
}
