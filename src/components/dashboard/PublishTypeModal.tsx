"use client";

import { AppImage } from "@/components/media/AppImage";
import { Modal } from "@heroui/react";
import type { ReleaseType } from "@/lib/supabase/database.types";

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
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        variant="blur"
        className="bg-zinc-950/70"
      >
        <Modal.Container size="md" placement="center" className="px-4">
          <Modal.Dialog className="overflow-hidden rounded-[28px] border border-black/10 bg-white text-zinc-950 shadow-2xl">
            <Modal.CloseTrigger className="text-zinc-500" />
            <Modal.Header className="border-b border-black/[0.07] px-6 pt-6 pb-4">
              <Modal.Heading className="text-2xl font-semibold tracking-tight text-zinc-950">
                Nouvelle publication
              </Modal.Heading>
              <p className="mt-1.5 text-sm text-zinc-500">
                Choisis le format de ta sortie.
              </p>
            </Modal.Header>
            <Modal.Body className="px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onSelect("single")}
                  className="group flex flex-col items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-6 text-center transition hover:border-black/20 hover:bg-zinc-100"
                >
                  <AppImage
                    src="/single.png"
                    alt="Single"
                    width={96}
                    height={96}
                    className="size-24 object-contain"
                  />
                  <span>
                    <span className="block text-base font-semibold text-zinc-950">Single</span>
                    <span className="mt-1 block text-sm text-zinc-500">
                      Un titre, une cover
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelect("album")}
                  className="group flex flex-col items-center gap-4 rounded-2xl border border-black/[0.07] bg-white p-6 text-center transition hover:border-black/20 hover:bg-zinc-100"
                >
                  <AppImage
                    src="/album.png"
                    alt="Album"
                    width={96}
                    height={96}
                    className="size-24 object-contain"
                  />
                  <span>
                    <span className="block text-base font-semibold text-zinc-950">Album</span>
                    <span className="mt-1 block text-sm text-zinc-500">
                      Plusieurs titres, cover globale
                    </span>
                  </span>
                </button>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
