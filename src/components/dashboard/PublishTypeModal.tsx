"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { PublishIcon, type PublishIconName } from "@/components/icons/PublishIcons";
import { MediaModal } from "@/components/ui/MediaModal";
import type { ReleaseType } from "@/lib/supabase/database.types";

export type PublishFormat = ReleaseType | "instrumental";

type Format = {
  type: PublishFormat;
  label: string;
  hint: string;
  needs: string;
  icon: PublishIconName;
};

const FORMATS: Format[] = [
  { type: "single", label: "Single", hint: "Un titre avec sa pochette", needs: "1 MP3", icon: "single" },
  { type: "album", label: "Album", hint: "Plusieurs titres sous une même pochette", needs: "2 MP3 et plus", icon: "album" },
];

const INSTRUMENTAL: Format = {
  type: "instrumental",
  label: "Instrumental",
  hint: "Une prod vendue en licence MP3, WAV ou stems, sur la vitrine Prods",
  needs: "Démo + WAV",
  icon: "instrumental",
};

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
  const formats = showInstrumental ? [...FORMATS, INSTRUMENTAL] : FORMATS;

  return (
    <MediaModal
      open={isOpen}
      onClose={() => onOpenChange(false)}
      title="Nouvelle publication"
      description="Que veux-tu publier ?"
      labelledBy="publish-type-title"
    >
      <ul className="flex flex-col gap-2 text-left">
        {formats.map((f) => (
          <li key={f.type}>
            <button
              type="button"
              onClick={() => onSelect(f.type)}
              className="group flex w-full items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-left transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.99]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white transition-colors group-hover:bg-white group-hover:text-black">
                <PublishIcon name={f.icon} size={26} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-medium text-white">{f.label}</span>
                  <span className="shrink-0 font-mono text-[11px] text-white/40">{f.needs}</span>
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-white/50">{f.hint}</span>
              </span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={16}
                className="shrink-0 text-white/30 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-white/70"
              />
            </button>
          </li>
        ))}
      </ul>
    </MediaModal>
  );
}
