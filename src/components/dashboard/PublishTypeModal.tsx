"use client";

import { AppImage } from "@/components/media/AppImage";
import { MediaModal } from "@/components/ui/MediaModal";
import type { ReleaseType } from "@/lib/supabase/database.types";

const FORMATS: { type: ReleaseType; label: string; hint: string; image: string }[] = [
  { type: "single", label: "Single", hint: "Un titre, une pochette", image: "/single.png" },
  { type: "album", label: "Album", hint: "Plusieurs titres", image: "/album.png" },
];

export function PublishTypeModal({
  isOpen,
  onOpenChange,
  onSelect,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: ReleaseType) => void;
}) {
  return (
    <MediaModal
      open={isOpen}
      onClose={() => onOpenChange(false)}
      title="Nouvelle publication"
      description="Choisis le format de ta sortie"
      labelledBy="publish-type-title"
    >
      <div className="grid grid-cols-2 gap-3">
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
      </div>
    </MediaModal>
  );
}
