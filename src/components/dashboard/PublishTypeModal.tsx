"use client";

import Image from "next/image";
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
        className="bg-black/70"
      >
        <Modal.Container size="md" placement="center" className="px-4">
          <Modal.Dialog className="overflow-hidden rounded-[28px] border border-white/12 bg-[#0d0d0d] text-white shadow-2xl">
            <Modal.CloseTrigger className="text-white/50" />
            <Modal.Header className="border-b border-white/8 px-6 pt-6 pb-4">
              <Modal.Heading className="font-display text-2xl font-bold tracking-tight">
                Nouvelle publication
              </Modal.Heading>
              <p className="mt-1.5 text-sm text-white/45">
                Choisis le format de ta sortie.
              </p>
            </Modal.Header>
            <Modal.Body className="px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onSelect("single")}
                  className="group flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center transition hover:border-white/25 hover:bg-white/[0.08]"
                >
                  <Image
                    src="/single.png"
                    alt="Single"
                    width={96}
                    height={96}
                    className="size-24 object-contain"
                  />
                  <span>
                    <span className="block text-base font-semibold">Single</span>
                    <span className="mt-1 block text-sm text-white/45">
                      Un titre, une cover
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelect("album")}
                  className="group flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center transition hover:border-white/25 hover:bg-white/[0.08]"
                >
                  <Image
                    src="/album.png"
                    alt="Album"
                    width={96}
                    height={96}
                    className="size-24 object-contain"
                  />
                  <span>
                    <span className="block text-base font-semibold">Album</span>
                    <span className="mt-1 block text-sm text-white/45">
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
