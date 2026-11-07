"use client";

import { useActionState } from "react";
import { Button, Input, Label } from "@heroui/react";
import { authInputClass, authLabelClass, authSubmitClass } from "./styles";
import { signUp, type AuthState } from "@/lib/actions/auth";
import type { UserRole } from "@/lib/supabase/database.types";
import { useActionToast } from "@/hooks/useActionToast";

const initial: AuthState = {};

export function CreatorSignUpForm({
  role,
}: {
  role: Extract<UserRole, "artist" | "label">;
}) {
  const [state, action, pending] = useActionState(signUp, initial);
  useActionToast(state);

  return (
    <form action={action} className="flex flex-col gap-3.5 sm:gap-4">
      <input type="hidden" name="role" value={role} />

      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Label htmlFor={`email_${role}`} className={authLabelClass}>
          Adresse mail
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

      <p className="text-xs leading-relaxed text-white/35">
        Ensuite, trois étapes (identité, genres, photo) pour ouvrir ton espace{" "}
        {role === "artist" ? "artiste" : "label"}.
      </p>

      <Button
        type="submit"
        isPending={pending}
        className={authSubmitClass}
      >
        Continuer
      </Button>
    </form>
  );
}
