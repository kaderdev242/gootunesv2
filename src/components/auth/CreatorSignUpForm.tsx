"use client";

import { useActionState } from "react";
import { Button, Input, Label } from "@heroui/react";
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

      <div className="flex flex-col gap-2">
        <Label htmlFor={`email_${role}`} className="text-white/70">
          Adresse mail
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

      <p className="text-xs leading-relaxed text-white/35">
        Ensuite, un onboarding en 3 étapes (identité, genres, photo) pour activer
        ton espace {role === "artist" ? "artiste" : "label"}.
      </p>

      <Button
        type="submit"
        isPending={pending}
        className="mt-1 h-12 rounded-full bg-white font-semibold text-black"
      >
        Continuer
      </Button>
    </form>
  );
}
