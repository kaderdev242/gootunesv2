"use client";

import { MediaModal } from "@/components/ui/MediaModal";

/**
 * Confirmation d'une action irréversible, au style des fenêtres Gootunes :
 * bouton principal blanc, annulation en lien dessous.
 */
export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  isPending = false,
  onConfirm,
  cover,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  cover?: string | null;
  /** Conservé pour compatibilité : toujours sombre. */
  theme?: "dark" | "light";
}) {
  const close = () => {
    if (!isPending) onOpenChange(false);
  };

  return (
    <MediaModal open={isOpen} onClose={close} cover={cover} title={title} description={description} labelledBy="confirm-dialog-title">
      <button
        type="button"
        onClick={onConfirm}
        disabled={isPending}
        className="mx-auto flex h-12 w-full max-w-xs items-center justify-center rounded-full bg-white text-[15px] font-semibold text-black transition-[background-color,transform] duration-150 hover:bg-white/90 active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? "Un instant…" : confirmLabel}
      </button>
      <button
        type="button"
        onClick={close}
        disabled={isPending}
        className="mx-auto mt-4 block text-[15px] font-medium text-white/70 transition-colors hover:text-white disabled:opacity-50"
      >
        {cancelLabel}
      </button>
    </MediaModal>
  );
}
