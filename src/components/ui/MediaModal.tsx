"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { useCoverPalette } from "@/hooks/useCoverPalette";

/**
 * Fenêtre modale Gootunes : fond teinté par la pochette, pochette en tête,
 * titre, texte puis actions. Fermeture par la croix, Échap ou un clic à côté.
 */
export function MediaModal({
  open,
  onClose,
  cover,
  title,
  description,
  children,
  labelledBy = "media-modal-title",
}: {
  open: boolean;
  onClose: () => void;
  cover?: string | null;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  labelledBy?: string;
}) {
  const palette = useCoverPalette(open ? cover : null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const tint = palette?.accent ?? palette?.dominant ?? null;
  const background = tint
    ? `linear-gradient(180deg, color-mix(in srgb, ${tint} 55%, #0b0b0b) 0%, #121212 78%)`
    : "#121212";

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4" role="presentation">
      <div className="absolute inset-0 bg-black/65 animate-[fade-in_160ms_ease-out]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative w-full max-w-[480px] overflow-hidden rounded-t-2xl border border-white/[0.08] px-6 pb-[calc(28px+env(safe-area-inset-bottom))] pt-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.6)] animate-[modal-rise_220ms_cubic-bezier(0.22,1,0.36,1)] sm:rounded-2xl sm:px-10 sm:pb-10"
        style={{ background }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.75} />
        </button>

        {cover ? (
          <div className="relative mx-auto mb-6 size-36 overflow-hidden rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] sm:size-40">
            <AppImage src={cover} alt="" fill className="object-cover" sizes="160px" />
          </div>
        ) : null}

        <h2 id={labelledBy} className="text-[22px] font-semibold leading-tight text-white">
          {title}
        </h2>
        {description ? <p className="mx-auto mt-2 max-w-sm text-[15px] text-white/65">{description}</p> : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
