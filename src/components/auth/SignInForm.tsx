"use client";

import { useActionState } from "react";
import { Button, Input, Label } from "@heroui/react";
import { authInputClass, authLabelClass, authSubmitClass } from "./styles";
import { signIn, type AuthState } from "@/lib/actions/auth";
import { useActionToast } from "@/hooks/useActionToast";

const initial: AuthState = {};

export function SignInForm({
  next = "",
}: {
  next?: string;
  /** Conservé pour compatibilité : les liens sont dans la page. */
  showSignupLink?: boolean;
}) {
  const [state, action, pending] = useActionState(signIn, initial);
  useActionToast(state);

  return (
    <form action={action} className="flex flex-col gap-3.5 sm:gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Label htmlFor="email" className={authLabelClass}>
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          enterKeyHint="next"
          placeholder="toi@email.com"
          // text-base = 16px → évite le zoom iOS au focus
          className={authInputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Label htmlFor="password" className={authLabelClass}>
          Mot de passe
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          enterKeyHint="go"
          placeholder="••••••••"
          className={authInputClass}
        />
      </div>

      <Button
        type="submit"
        isPending={pending}
        className={authSubmitClass}
      >
        Se connecter
      </Button>

    </form>
  );
}
