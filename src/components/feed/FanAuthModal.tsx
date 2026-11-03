"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@heroui/react";
import { RoleSignUpForm } from "@/components/auth/RoleSignUpForm";
import { SignInForm } from "@/components/auth/SignInForm";

type Mode = "signup" | "signin";

export function FanAuthModal({
  isOpen,
  onOpenChange,
  initialMode = "signup",
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);

  useEffect(() => {
    if (isOpen) setMode(initialMode);
  }, [isOpen, initialMode]);

  function handleOpenChange(open: boolean) {
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
        <Modal.Container
          size="md"
          // Bottom sheet-ish on mobile → clavier moins gênant
          placement="center"
          className="items-end px-0 sm:items-center sm:px-4"
        >
          <Modal.Dialog className="max-h-[min(92dvh,720px)] w-full overflow-hidden rounded-t-[28px] border border-white/12 bg-[#0d0d0d] text-white shadow-2xl sm:max-h-[min(88dvh,640px)] sm:rounded-[28px]">
            <Modal.CloseTrigger className="text-white/50" />
            <Modal.Header className="shrink-0 border-b border-white/8 px-4 pt-5 pb-3 sm:px-6 sm:pt-6 sm:pb-4">
              <Modal.Heading className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                {mode === "signup" ? "Compte fan" : "Connexion"}
              </Modal.Heading>
              <p className="mt-1 text-sm text-white/45">
                {mode === "signup"
                  ? "Achète, écoute et construis ta bibliothèque."
                  : "Retrouve Discover et ta bibliothèque."}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-1 sm:mt-4">
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    mode === "signup"
                      ? "bg-white text-black"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  S&apos;inscrire
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    mode === "signin"
                      ? "bg-white text-black"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Se connecter
                </button>
              </div>
            </Modal.Header>

            <Modal.Body className="min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-5">
              {mode === "signup" ? (
                <>
                  <RoleSignUpForm role="fan" compact />
                  <p className="mt-4 text-center text-sm text-white/45">
                    Artiste ou label ?{" "}
                    <Link
                      href="/inscription?role=artist"
                      className="text-white underline-offset-2 hover:underline"
                    >
                      Créer un compte créateur
                    </Link>
                  </p>
                </>
              ) : (
                <SignInForm next="/discover" showSignupLink={false} />
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
