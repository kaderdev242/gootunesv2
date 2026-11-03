"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Input, Label } from "@heroui/react";
import { signIn, type AuthState } from "@/lib/actions/auth";
import { useActionToast } from "@/hooks/useActionToast";

const initial: AuthState = {};

export function SignInForm({
  next = "",
  showSignupLink = true,
}: {
  next?: string;
  showSignupLink?: boolean;
}) {
  const [state, action, pending] = useActionState(signIn, initial);
  useActionToast(state);

  return (
    <form action={action} className="flex flex-col gap-3.5 sm:gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Label htmlFor="email" className="text-sm text-white/70">
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
          className="h-12 rounded-2xl border-white/12 bg-white/[0.04] text-base"
        />
      </div>
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Label htmlFor="password" className="text-sm text-white/70">
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
          className="h-12 rounded-2xl border-white/12 bg-white/[0.04] text-base"
        />
      </div>

      <Button
        type="submit"
        isPending={pending}
        className="mt-1 h-12 rounded-full bg-white text-base font-semibold text-black"
      >
        Se connecter
      </Button>

      {showSignupLink ? (
        <p className="text-center text-sm text-white/45">
          Fan ?{" "}
          <Link
            href="/"
            className="text-white underline-offset-2 hover:underline"
          >
            Inscription dans Discover
          </Link>
          <span className="mx-2 text-white/20">·</span>
          Artiste / Label ?{" "}
          <Link
            href="/inscription?role=artist"
            className="text-white underline-offset-2 hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      ) : null}
    </form>
  );
}
