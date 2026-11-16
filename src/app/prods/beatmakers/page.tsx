import { BeatmakerTiles } from "@/components/prods/BeatmakerTiles";
import { listBeatmakers } from "@/lib/prods/queries";

export const metadata = { title: "Beatmakers" };

export default async function BeatmakersPage() {
  const beatmakers = await listBeatmakers(120);
  return (
    <div className="pt-12">
      <h1 className="font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.03em]">Beatmakers</h1>
      <p className="mt-2 text-[15px] text-white/55">Classés par nombre d&apos;écoutes de leurs démos</p>
      <div className="mt-10">
        {beatmakers.length ? (
          <BeatmakerTiles beatmakers={beatmakers} />
        ) : (
          <p className="py-16 text-center text-sm text-white/50">Aucun beatmaker en ligne pour l&apos;instant</p>
        )}
      </div>
    </div>
  );
}
