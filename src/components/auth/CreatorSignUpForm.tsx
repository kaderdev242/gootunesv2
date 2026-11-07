"use client";

import { useActionState } from "react";
import { Button, Input, Label } from "@heroui/react";
import { authInputClass, authSubmitClass } from "./styles";
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
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="role" value={role} />

      <div className="flex flex-col">
        <Label htmlFor={`email_${role}`} className="sr-only">
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
          placeholder="Adresse e-mail"
          className={authInputClass}
        />
      </div>

      <div className="flex flex-col">
        <Label htmlFor={`password_${role}`} className="sr-only">
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
          placeholder="Mot de passe (6 caractères min.)"
          className={authInputClass}
        />
      </div>

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
