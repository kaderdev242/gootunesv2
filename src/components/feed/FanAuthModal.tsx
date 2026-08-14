"use client";

import { useEffect, useState } from "react";
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
        <Modal.Container size="md" placement="center" className="px-4">
          <Modal.Dialog className="overflow-hidden rounded-[28px] border border-white/12 bg-[#0d0d0d] text-white shadow-2xl">
            <Modal.CloseTrigger className="text-white/50" />
            <Modal.Header className="border-b border-white/8 px-6 pt-6 pb-4">
              <Modal.Heading className="font-display text-2xl font-bold tracking-tight">
                {mode === "signup" ? "Compte fan" : "Connexion"}
              </Modal.Heading>
              <p className="mt-1.5 text-sm text-white/45">
                {mode === "signup"
                  ? "Achète, écoute et construis ta bibliothèque."
                  : "Retrouve Discover et ta bibliothèque."}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-1">
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

            <Modal.Body className="px-6 py-5">
              {mode === "signup" ? (
                <RoleSignUpForm role="fan" compact />
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
