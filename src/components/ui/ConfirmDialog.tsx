"use client";

import { AlertDialog, Button } from "@heroui/react";

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  isPending = false,
  onConfirm,
  theme = "dark",
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  theme?: "dark" | "light";
}) {
  const light = theme === "light";

  return (
    <AlertDialog>
      <AlertDialog.Backdrop
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        variant="blur"
        className={light ? "bg-black/40" : "bg-black/70"}
      >
        <AlertDialog.Container placement="center" className="px-4">
          <AlertDialog.Dialog
            className={
              light
                ? "rounded-[28px] border border-zinc-200 bg-white text-zinc-900 shadow-xl sm:max-w-[420px]"
                : "rounded-[28px] border border-white/12 bg-[#111] text-white sm:max-w-[420px]"
            }
          >
            <AlertDialog.CloseTrigger
              className={light ? "text-zinc-400" : "text-white/50"}
            />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading
                className={
                  light
                    ? "text-xl font-bold tracking-tight"
                    : "font-display text-xl font-bold"
                }
              >
                {title}
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p
                className={
                  light
                    ? "text-sm leading-relaxed text-zinc-500"
                    : "text-sm leading-relaxed text-white/55"
                }
              >
                {description}
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button
                variant="outline"
                className={
                  light
                    ? "rounded-full border-zinc-200 bg-white text-zinc-700"
                    : "rounded-full border-white/20 bg-transparent text-white"
                }
                onPress={() => onOpenChange(false)}
                isDisabled={isPending}
              >
                {cancelLabel}
              </Button>
              <Button
                className="rounded-full bg-red-500 font-semibold text-white"
                isPending={isPending}
                onPress={onConfirm}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
