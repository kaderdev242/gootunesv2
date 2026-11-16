"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { DrumIcon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { MediaModal } from "@/components/ui/MediaModal";
import type { ReleaseType } from "@/lib/supabase/database.types";

export type PublishFormat = ReleaseType | "instrumental";

const FORMATS: { type: ReleaseType; label: string; hint: string; image: string }[] = [
  { type: "single", label: "Single", hint: "Un titre, une pochette", image: "/single.png" },
  { type: "album", label: "Album", hint: "Plusieurs titres", image: "/album.png" },
];

export function PublishTypeModal({
  isOpen,
  onOpenChange,
  onSelect,
  showInstrumental = false,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: PublishFormat) => void;
  /** Option « Instrumental » (prods) — visible seulement si la fonctionnalité est active. */
  showInstrumental?: boolean;
}) {
  return (
    <MediaModal
      open={isOpen}
      onClose={() => onOpenChange(false)}
      title="Nouvelle publication"
      description="Choisis le format de ta sortie"
      labelledBy="publish-type-title"
    >
      <div className={`grid grid-cols-2 gap-3 ${showInstrumental ? "sm:grid-cols-3" : ""}`}>
        {FORMATS.map((f) => (
          <button
            key={f.type}
            type="button"
            onClick={() => onSelect(f.type)}
            className="flex flex-col items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-6 transition-[background-color,transform] duration-150 hover:bg-white/[0.1] active:scale-[0.98]"
          >
            <AppImage src={f.image} alt="" width={80} height={80} className="size-20 object-contain" />
            <span>
              <span className="block text-[15px] font-semibold text-white">{f.label}</span>
              <span className="mt-1 block text-[13px] text-white/50">{f.hint}</span>
            </span>
          </button>
        ))}
        {showInstrumental ? (
          <button
            type="button"
            onClick={() => onSelect("instrumental")}
            className="col-span-2 flex flex-col items-center gap-3 rounded-2xl bg-white/[0.06] px-4 py-6 transition-[background-color,transform] duration-150 hover:bg-white/[0.1] active:scale-[0.98] sm:col-span-1"
          >
            <span className="flex size-20 items-center justify-center rounded-full bg-violet-400/15 text-violet-300">
              <HugeiconsIcon icon={DrumIcon} size={36} />
            </span>
            <span>
              <span className="block text-[15px] font-semibold text-white">Instrumental</span>
              <span className="mt-1 block text-[13px] text-white/50">Une prod à vendre</span>
            </span>
          </button>
        ) : null}
      </div>
    </MediaModal>
  );
}
