"use client";

import { useActionState, useEffect, useState } from "react";
import { Button, Input, Label, Modal, TextArea } from "@heroui/react";
import {
  submitContactLead,
  type ContactIntent,
} from "@/lib/actions/contact";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";

const initial: ActionState = {};

export function ContactLeadModal({
  isOpen,
  onOpenChange,
  intent,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  intent: ContactIntent;
}) {
  const [state, action, pending] = useActionState(submitContactLead, initial);
  useActionToast(state);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (isOpen) setKey((k) => k + 1);
  }, [isOpen, intent]);

  useEffect(() => {
    if (state.success) onOpenChange(false);
  }, [state.success, onOpenChange]);

  const title =
    intent === "call" ? "Planifier un appel" : "Nous contacter";
  const subtitle =
    intent === "call"
      ? "Dis-nous qui tu es — on te propose un créneau rapidement."
      : "Parle-nous de ta marque et de ce que tu veux créer avec Gootunes.";

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
                {title}
              </Modal.Heading>
              <p className="mt-1.5 text-sm text-white/45">{subtitle}</p>
            </Modal.Header>

            <Modal.Body className="px-6 py-5">
              <form
                key={key}
                action={action}
                className="flex flex-col gap-3"
              >
                <input type="hidden" name="intent" value={intent} />
                {/* Honeypot */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden
                />

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact_name" className="text-white/70">
                    Nom
                  </Label>
                  <Input
                    id="contact_name"
                    name="name"
                    required
                    placeholder="Ton nom"
                    className="h-11 rounded-2xl border-white/12 bg-white/[0.04]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact_email" className="text-white/70">
                    Email
                  </Label>
                  <Input
                    id="contact_email"
                    name="email"
                    type="email"
                    required
                    placeholder="toi@marque.com"
                    className="h-11 rounded-2xl border-white/12 bg-white/[0.04]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact_company" className="text-white/70">
                    Entreprise / marque{" "}
                    <span className="text-white/35">(optionnel)</span>
                  </Label>
                  <Input
                    id="contact_company"
                    name="company"
                    placeholder="Nom de la marque"
                    className="h-11 rounded-2xl border-white/12 bg-white/[0.04]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact_message" className="text-white/70">
                    Message
                  </Label>
                  <TextArea
                    id="contact_message"
                    name="message"
                    required
                    rows={4}
                    placeholder={
                      intent === "call"
                        ? "Objectif de l’appel, disponibilité…"
                        : "Idée de partenariat, budget, timing…"
                    }
                    className="rounded-2xl border-white/12 bg-white/[0.04]"
                  />
                </div>

                <Button
                  type="submit"
                  isPending={pending}
                  className="mt-1 h-11 rounded-full bg-white font-semibold text-black"
                >
                  Envoyer
                </Button>
              </form>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
