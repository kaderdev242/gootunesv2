"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Button, Input, Label } from "@heroui/react";
import { authInputClass, authLabelClass, authSubmitClass } from "./styles";
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
  next = "",
}: {
  role: UserRole;
  next?: string;
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
    <form
      action={action}
      className={`flex flex-col ${compact ? "gap-3" : "gap-3.5 sm:gap-4"}`}
    >
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Label
          htmlFor={`display_name_${role}`}
          className={authLabelClass}
        >
          {labels.nameLabel}
        </Label>
        <Input
          id={`display_name_${role}`}
          name="display_name"
          required
          autoComplete="nickname"
          enterKeyHint="next"
          placeholder={labels.namePlaceholder}
          className={authInputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Label htmlFor={`country_${role}`} className={authLabelClass}>
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

      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Label htmlFor={`email_${role}`} className={authLabelClass}>
          Email
        </Label>
        <Input
          id={`email_${role}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          enterKeyHint="next"
          placeholder="toi@email.com"
          className={authInputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Label htmlFor={`password_${role}`} className={authLabelClass}>
          Mot de passe
        </Label>
        <Input
          id={`password_${role}`}
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          enterKeyHint="go"
          placeholder="Min. 6 caractères"
          className={authInputClass}
        />
      </div>

      <p className="text-[12px] leading-relaxed text-white/40">
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
        className={authSubmitClass}
      >
        {compact && role === "fan" ? "Créer mon compte" : labels.submit}
      </Button>
    </form>
  );
}
