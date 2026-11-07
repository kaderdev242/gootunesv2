"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { lookupAuthEmail, signIn, signUp, type AuthState } from "@/lib/actions/auth";
import { useActionToast } from "@/hooks/useActionToast";
import { useDefaultCountry } from "@/hooks/useDefaultCountry";
import { getCountryLabel } from "@/lib/constants";
import { toastError } from "@/lib/toast";
import { CountryFlag } from "./CountryFlag";
import { CountrySelect } from "./CountrySelect";
import { authInputClass, authSubmitClass } from "./styles";

type Step = "email" | "password" | "signup";

const initial: AuthState = {};

/**
 * Connexion et inscription fan sur une seule page :
 * l'e-mail d'abord, puis le mot de passe (compte existant)
 * ou le pseudo et le mot de passe (nouveau compte).
 */
export function AuthFlow({ next = "" }: { next?: string }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [checking, startCheck] = useTransition();
  const emailRef = useRef<HTMLInputElement>(null);

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    startCheck(async () => {
      const res = await lookupAuthEmail(value);
      if ("error" in res) {
        toastError(res.error);
        return;
      }
      setStep(res.status === "existing" ? "password" : "signup");
    });
  }

  function changeEmail() {
    setStep("email");
    requestAnimationFrame(() => emailRef.current?.focus());
  }

  return (
    <div className="w-full">
      <h1 className="text-center text-[22px] font-semibold leading-tight text-white">
        {step === "email" ? "Inscris-toi ou connecte-toi" : step === "password" ? "Bon retour" : "Crée ton compte"}
      </h1>

      {step === "email" ? (
        <form onSubmit={submitEmail} className="mt-10 flex flex-col gap-4">
          <label htmlFor="auth-email" className="sr-only">
            Adresse e-mail
          </label>
          <input
            ref={emailRef}
            id="auth-email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            inputMode="email"
            enterKeyHint="go"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${authInputClass} w-full px-4 outline-none`}
          />
          <button type="submit" disabled={checking || !email.trim()} className={`${authSubmitClass} disabled:bg-white/25 disabled:text-black/60`}>
            {checking ? "Un instant…" : "Continuer"}
          </button>
        </form>
      ) : (
        <div className="mt-6 flex items-center justify-center gap-2 text-[14px]">
          <span className="truncate text-white/60">{email.trim()}</span>
          <button type="button" onClick={changeEmail} className="shrink-0 font-medium text-white underline-offset-4 hover:underline">
            Modifier
          </button>
        </div>
      )}

      {step === "password" ? <PasswordStep email={email.trim()} next={next} /> : null}
      {step === "signup" ? <SignupStep email={email.trim()} next={next} /> : null}
    </div>
  );
}

function PasswordStep({ email, next }: { email: string; next: string }) {
  const [state, action, pending] = useActionState(signIn, initial);
  useActionToast(state);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      {/* Champ e-mail caché pour les gestionnaires de mots de passe. */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <label htmlFor="auth-password" className="sr-only">
        Mot de passe
      </label>
      <input
        id="auth-password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        enterKeyHint="go"
        placeholder="Mot de passe"
        className={`${authInputClass} w-full px-4 outline-none`}
      />
      <button type="submit" disabled={pending} className={`${authSubmitClass} disabled:opacity-60`}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

function SignupStep({ email, next }: { email: string; next: string }) {
  const [state, action, pending] = useActionState(signUp, initial);
  useActionToast(state);
  const { country, setCountry } = useDefaultCountry();
  const [editCountry, setEditCountry] = useState(false);

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="role" value="fan" />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="country" value={country} />
      <input type="email" autoComplete="username" value={email} readOnly hidden />

      <label htmlFor="auth-name" className="sr-only">
        Pseudo
      </label>
      <input
        id="auth-name"
        name="display_name"
        required
        autoFocus
        maxLength={80}
        autoComplete="nickname"
        enterKeyHint="next"
        placeholder="Pseudo"
        className={`${authInputClass} w-full px-4 outline-none`}
      />
      <label htmlFor="auth-new-password" className="sr-only">
        Mot de passe
      </label>
      <input
        id="auth-new-password"
        name="password"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        enterKeyHint="go"
        placeholder="Mot de passe (6 caractères min.)"
        className={`${authInputClass} w-full px-4 outline-none`}
      />

      {editCountry ? (
        <CountrySelect id="auth-country" value={country} onChange={setCountry} />
      ) : (
        <p className="flex items-center gap-2 text-[14px] text-white/55">
          <CountryFlag code={country} title={getCountryLabel(country)} />
          {getCountryLabel(country)}
          <button type="button" onClick={() => setEditCountry(true)} className="font-medium text-white underline-offset-4 hover:underline">
            Changer
          </button>
        </p>
      )}

      <button type="submit" disabled={pending} className={`${authSubmitClass} disabled:opacity-60`}>
        {pending ? "Création…" : "Créer mon compte"}
      </button>

      <p className="text-center text-[12px] leading-relaxed text-white/40">
        En continuant, tu acceptes les{" "}
        <Link href="/termes" target="_blank" className="text-white/70 underline underline-offset-2">
          conditions
        </Link>{" "}
        et la{" "}
        <Link href="/confidentialite" target="_blank" className="text-white/70 underline underline-offset-2">
          politique de confidentialité
        </Link>
      </p>
    </form>
  );
}
