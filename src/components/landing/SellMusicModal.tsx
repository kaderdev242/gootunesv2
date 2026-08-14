"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Modal } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Mic02Icon,
  Building06Icon,
} from "@hugeicons/core-free-icons";
import { CreatorSignUpForm } from "@/components/auth/CreatorSignUpForm";
import type { UserRole } from "@/lib/supabase/database.types";

type CreatorRole = Extract<UserRole, "artist" | "label">;

export function SellMusicModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [role, setRole] = useState<CreatorRole | null>(null);

  function handleOpenChange(open: boolean) {
    if (!open) setRole(null);
    onOpenChange(open);
  }

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        variant="blur"
        className="bg-black/70"
      >
        <Modal.Container size="md" placement="center" className="px-4">
          <Modal.Dialog className="overflow-hidden rounded-[28px] border border-white/12 bg-[#0d0d0d] text-white shadow-2xl">
            <Modal.CloseTrigger className="text-white/50" />
            <Modal.Header className="border-b border-white/8 px-6 pt-6 pb-4">
              <Modal.Heading className="font-display text-2xl font-bold tracking-tight">
                {role
                  ? role === "artist"
                    ? "Compte artiste"
                    : "Compte label"
                  : "Vendre ma musique"}
              </Modal.Heading>
              <p className="mt-1.5 text-sm text-white/45">
                {role
                  ? "Renseigne tes infos pour publier sur Gootunes."
                  : "Choisis ton parcours — inscription gratuite pour les artistes."}
              </p>
            </Modal.Header>

            <Modal.Body className="px-6 py-5">
              {!role ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRole("artist")}
                    className="group flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/25 hover:bg-white/[0.08]"
                  >
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-white transition group-hover:bg-white group-hover:text-black">
                      <HugeiconsIcon icon={Mic02Icon} size={22} />
                    </span>
                    <span>
                      <span className="block text-base font-semibold">Artiste</span>
                      <span className="mt-1 block text-sm text-white/45">
                        Commencer en tant qu&apos;indépendant
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("label")}
                    className="group flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/25 hover:bg-white/[0.08]"
                  >
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-white transition group-hover:bg-white group-hover:text-black">
                      <HugeiconsIcon icon={Building06Icon} size={22} />
                    </span>
                    <span>
                      <span className="block text-base font-semibold">Label</span>
                      <span className="mt-1 block text-sm text-white/45">
                        Commencer en tant que label
                      </span>
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-fit gap-1 px-0 text-white/55 hover:bg-transparent hover:text-white"
                    onPress={() => setRole(null)}
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                    Changer de parcours
                  </Button>
                  <CreatorSignUpForm role={role} />
                </div>
              )}
            </Modal.Body>

            <Modal.Footer className="justify-center border-t border-white/8 px-6 py-4">
              <p className="text-center text-sm text-white/40">
                Déjà un compte ?{" "}
                <Link
                  href="/connexion"
                  className="text-white underline-offset-2 hover:underline"
                  onClick={() => handleOpenChange(false)}
                >
                  Se connecter
                </Link>
              </p>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
