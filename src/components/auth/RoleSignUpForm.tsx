"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Button, Input, Label } from "@heroui/react";
import { signUp, type AuthState } from "@/lib/actions/auth";
import type { UserRole } from "@/lib/supabase/database.types";
import { useDefaultCountry } from "@/hooks/useDefaultCountry";
import { useActionToast } from "@/hooks/useActionToast";
import { CountrySelect } from "./CountrySelect";

const initial: AuthState = {};

const copy: Record<
  Exclude<UserRole, "fan"> | "fan",
  { nameLabel: string; namePlaceholder: string; submit: string }
> = {
  fan: {
    nameLabel: "Pseudo",
    namePlaceholder: "Ton pseudo",
    submit: "Créer mon compte fan",
  },
  artist: {
    nameLabel: "Nom de scène",
    namePlaceholder: "Ex. DJ Kuba",
    submit: "Créer mon compte artiste",
  },
  label: {
    nameLabel: "Nom du label",
    namePlaceholder: "Ex. Empire Sounds",
    submit: "Créer mon compte label",
  },
};

export function RoleSignUpForm({
  role,
  onSuccessMessage,
  compact = false,
}: {
  role: UserRole;
  onSuccessMessage?: (msg: string) => void;
  compact?: boolean;
}) {
  const { country, setCountry, ready } = useDefaultCountry();
  const [state, action, pending] = useActionState(signUp, initial);
  useActionToast(state);
  const labels = copy[role];

  useEffect(() => {
    if (state.success && onSuccessMessage) onSuccessMessage(state.success);
  }, [state.success, onSuccessMessage]);

  return (
    <form action={action} className={`flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
      <input type="hidden" name="role" value={role} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={`display_name_${role}`} className="text-white/70">
          {labels.nameLabel}
        </Label>
        <Input
          id={`display_name_${role}`}
          name="display_name"
          required
          placeholder={labels.namePlaceholder}
          className="h-12 rounded-2xl border-white/12 bg-white/[0.04]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`country_${role}`} className="text-white/70">
          Pays
        </Label>
        <CountrySelect
          id={`country_${role}`}
          value={country}
          onChange={setCountry}
        />
        {!ready ? (
          <p className="text-[11px] text-white/35">Détection du pays…</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`email_${role}`} className="text-white/70">
          Email
        </Label>
        <Input
          id={`email_${role}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="toi@email.com"
          className="h-12 rounded-2xl border-white/12 bg-white/[0.04]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`password_${role}`} className="text-white/70">
          Mot de passe
        </Label>
        <Input
          id={`password_${role}`}
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Min. 6 caractères"
          className="h-12 rounded-2xl border-white/12 bg-white/[0.04]"
        />
      </div>

      <p className="text-[11px] leading-relaxed text-white/40">
        En créant un compte, tu acceptes les{" "}
        <Link
          href="/termes"
          className="text-white/70 underline decoration-white/20 underline-offset-2 hover:text-white"
          target="_blank"
        >
          Conditions d&apos;utilisation
        </Link>{" "}
        et la{" "}
        <Link
          href="/confidentialite"
          className="text-white/70 underline decoration-white/20 underline-offset-2 hover:text-white"
          target="_blank"
        >
          Politique de confidentialité
        </Link>
        . Gootunes n&apos;a aucun droit sur les morceaux publiés.
      </p>

      <Button
        type="submit"
        isPending={pending}
        className="mt-1 h-12 rounded-full bg-white font-semibold text-black"
      >
        {labels.submit}
      </Button>
    </form>
  );
}
