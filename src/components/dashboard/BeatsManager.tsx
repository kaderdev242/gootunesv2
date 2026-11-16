"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PauseIcon, PlayIcon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatMoney } from "@/lib/format";
import { deleteBeat } from "@/lib/prods/actions";
import { LICENSE_ORDER, LICENSES, beatPriceFor } from "@/lib/prods/constants";
import { toastError, toastSuccess } from "@/lib/toast";
import { FALLBACK_COVER } from "@/lib/types/music";

export type BeatRow = {
  id: string;
  public_id: string;
  title: string;
  cover_url: string | null;
  bpm: number | null;
  musical_key: string | null;
  is_hidden: boolean;
  plays_count: number;
  price_mp3_fcfa: number | null;
  price_wav_fcfa: number | null;
  price_stems_fcfa: number | null;
  sales: number;
};

/** Liste des prods du créateur, sous ses publications (dashboard inchangé sinon). */
export function BeatsManager({
  beats,
  country,
  prodsUrl,
}: {
  beats: BeatRow[];
  country?: string | null;
  prodsUrl: string;
}) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<BeatRow | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(b: BeatRow) {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing === b.public_id) {
      audio.pause();
      setPlaying(null);
      return;
    }
    audio.src = `/api/prods/demo/${b.public_id}`;
    void audio.play().then(
      () => setPlaying(b.public_id),
      () => toastError("Lecture impossible."),
    );
  }

  if (!beats.length) return null;

  return (
    <section className="mt-12">
      <audio ref={audioRef} className="hidden" onEnded={() => setPlaying(null)} />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">Prods</h2>
          <p className="mt-1 text-sm text-white/50">Tes instrumentaux en vente sur la vitrine Prods.</p>
        </div>
        <a href={prodsUrl} target="_blank" rel="noreferrer" className="text-sm text-white/60 underline-offset-2 hover:text-white hover:underline">
          Voir la vitrine
        </a>
      </div>
      <div className="flex flex-col gap-3">
        {beats.map((b) => (
          <div key={b.id} className="flex items-center gap-4 rounded-[28px] border border-white/[0.06] bg-[#0f0f10] p-4">
            <button
              type="button"
              onClick={() => toggle(b)}
              className="group relative size-[72px] shrink-0 overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10"
              aria-label={playing === b.public_id ? "Pause" : "Écouter la démo"}
            >
              <AppImage src={b.cover_url || FALLBACK_COVER} alt="" fill className="object-cover" sizes="72px" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
                <HugeiconsIcon icon={playing === b.public_id ? PauseIcon : PlayIcon} size={22} />
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">
                {b.title}
                {b.is_hidden ? <span className="ml-2 text-xs font-normal text-white/40">· retirée</span> : null}
              </p>
              <p className="mt-0.5 truncate text-xs text-white/45">
                {[b.bpm && `${b.bpm} BPM`, b.musical_key, `${b.plays_count} écoutes`, `${b.sales} vente${b.sales > 1 ? "s" : ""}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-1 truncate text-xs text-white/60">
                {LICENSE_ORDER.filter((l) => beatPriceFor(b, l) !== null)
                  .map((l) => `${LICENSES[l].name.replace("Licence ", "")} ${formatMoney(beatPriceFor(b, l)!, country)}`)
                  .join(" · ")}
              </p>
            </div>
            {!b.is_hidden ? (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="text-red-400"
                aria-label="Supprimer la prod"
                onPress={() => setConfirm(b)}
              >
                <HugeiconsIcon icon={Delete02Icon} size={18} />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      <ConfirmDialog
        isOpen={Boolean(confirm)}
        onOpenChange={(o) => {
          if (!o) setConfirm(null);
        }}
        title="Supprimer cette prod ?"
        description={
          confirm?.sales
            ? `« ${confirm.title} » a déjà été vendue : elle sera retirée de la vitrine, les acheteurs gardent leurs fichiers.`
            : `Supprimer « ${confirm?.title ?? ""} » ? Cette action est définitive.`
        }
        confirmLabel="Supprimer"
        isPending={pending}
        onConfirm={() => {
          if (!confirm) return;
          startTransition(async () => {
            const res = await deleteBeat(confirm.id);
            if (res.error) toastError(res.error);
            else {
              toastSuccess(res.success || "Prod supprimée.");
              router.refresh();
            }
            setConfirm(null);
          });
        }}
      />
    </section>
  );
}
