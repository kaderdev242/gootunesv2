"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Building03Icon,
  Mic01Icon,
} from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { CountrySelect } from "@/components/auth/CountrySelect";
import { GenrePicker } from "@/components/genres/GenrePicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useActionToast } from "@/hooks/useActionToast";
import { updateFanPassword, updateFanSettings } from "@/lib/actions/fan-settings";
import type { ActionState } from "@/lib/actions/profile";
import { signOut } from "@/lib/actions/auth";
import { getOperatorsForCountry, type CountryCode } from "@/lib/constants";
import { DEFAULT_COUNTRY, isCountryCode } from "@/lib/geo";
import { phonePlaceholder } from "@/lib/mbiyo/config";
import { uploadViaApi } from "@/lib/upload-client";
import { mapUploadError } from "@/lib/errors";
import { toastError } from "@/lib/toast";
import type { Profile } from "@/lib/supabase/database.types";

const initial: ActionState = {};

const inputClass = "h-12 rounded-2xl border-white/12 bg-white/[0.04]";

function Section({
  title,
  description,
  children,
  tone = "default",
  id,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-6 rounded-[28px] border p-5 sm:p-7 ${
        tone === "danger"
          ? "border-red-500/20 bg-red-500/[0.03]"
          : "border-white/[0.08] bg-white/[0.02]"
      }`}
    >
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-white/45">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function FanSettingsView({ profile }: { profile: Profile }) {
  return (
    <div className="flex flex-col gap-6">
      <ProfileAndPaymentForm profile={profile} />
      <BecomeCreatorSection />
      <PasswordForm />
      <SessionSection />
      <DeleteAccountSection />
    </div>
  );
}

function ProfileAndPaymentForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateFanSettings, initial);
  useActionToast(state);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [genres, setGenres] = useState<string[]>(profile.genres ?? []);
  const [country, setCountry] = useState<CountryCode>(
    profile.country && isCountryCode(profile.country)
      ? profile.country
      : DEFAULT_COUNTRY,
  );
  const operators = useMemo(() => getOperatorsForCountry(country), [country]);

  async function onAvatarChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toastError("Fichier image requis.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError("Photo trop lourde", "5 Mo maximum.");
      return;
    }
    setUploading(true);
    try {
      setAvatarUrl((await uploadViaApi(file, "avatar")).fileUrl);
    } catch (e) {
      toastError("Upload impossible", mapUploadError(e));
    } finally {
      setUploading(false);
    }
  }

  const initialLetter = (profile.display_name || "G").slice(0, 1).toUpperCase();

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="avatar_url" value={avatarUrl} />

      <Section
        title="Profil"
        description="Ce que les autres voient sur tes playlists publiques."
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-5">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5">
              {avatarUrl ? (
                <AppImage
                  src={avatarUrl}
                  alt="Photo de profil"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl font-semibold text-white/40">
                  {initialLetter}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                {uploading
                  ? "Envoi…"
                  : avatarUrl
                    ? "Changer la photo"
                    : "Ajouter une photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => onAvatarChange(e.target.files?.[0] || null)}
                />
              </label>
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className="rounded-full px-3 py-2 text-sm text-white/50 transition hover:text-white"
                >
                  Retirer
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fan-display-name" className="text-white/70">
              Pseudo
            </Label>
            <Input
              id="fan-display-name"
              name="display_name"
              defaultValue={profile.display_name || ""}
              required
              minLength={2}
              maxLength={40}
              className={inputClass}
            />
          </div>

          <GenrePicker
            label="Genres préférés"
            value={genres}
            onChange={setGenres}
            name="genres"
            max={8}
          />
        </div>
      </Section>

      <Section
        title="Paiement Mobile Money"
        description="Ton numéro est pré-rempli à chaque achat. Le pays définit la devise et les opérateurs disponibles."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label className="text-white/70">Pays</Label>
            <CountrySelect value={country} onChange={setCountry} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fan-phone" className="text-white/70">
              Numéro d&apos;achat
            </Label>
            <Input
              id="fan-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={profile.phone || ""}
              placeholder={phonePlaceholder(country)}
              className={inputClass}
            />
            {operators.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {operators.map((op) => (
                  <span
                    key={op.id}
                    className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/55"
                  >
                    {op.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button
          type="submit"
          isPending={pending || uploading}
          className="h-12 rounded-full bg-white px-8 font-semibold text-black"
        >
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

function BecomeCreatorSection() {
  const options = [
    {
      role: "artist",
      title: "Artiste",
      text: "Publie tes singles et albums, vends ta musique et suis tes revenus.",
      icon: Mic01Icon,
      card: "border-violet-400/20 bg-violet-500/[0.07] hover:border-violet-300/40 hover:bg-violet-500/[0.12]",
      chip: "bg-violet-400/15 text-violet-200",
    },
    {
      role: "label",
      title: "Label",
      text: "Gère plusieurs artistes, leurs sorties et les revenus du catalogue.",
      icon: Building03Icon,
      card: "border-amber-400/20 bg-amber-500/[0.06] hover:border-amber-300/40 hover:bg-amber-500/[0.11]",
      chip: "bg-amber-400/15 text-amber-200",
    },
  ] as const;

  return (
    <Section
      id="devenir-createur"
      title="Passer en compte créateur"
      description="Garde ton email, tes achats et tes playlists. Ton compte devient créateur une fois le profil complété."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((opt) => (
          <Link
            key={opt.role}
            href={`/onboarding?devenir=${opt.role}`}
            className={`group flex flex-col gap-3 rounded-2xl border p-5 transition ${opt.card}`}
          >
            <div className="flex items-center justify-between">
              <span className={`flex size-10 items-center justify-center rounded-full ${opt.chip}`}>
                <HugeiconsIcon icon={opt.icon} size={20} />
              </span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={18}
                className="text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white"
              />
            </div>
            <div>
              <p className="font-semibold text-white">Devenir {opt.title.toLowerCase()}</p>
              <p className="mt-1 text-sm text-white/45">{opt.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

function PasswordForm() {
  const [state, action, pending] = useActionState(updateFanPassword, initial);
  useActionToast(state);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <Section title="Sécurité" description="Change ton mot de passe de connexion.">
      <form
        ref={formRef}
        action={action}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fan-password" className="text-white/70">
              Nouveau mot de passe
            </Label>
            <Input
              id="fan-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fan-password-confirm" className="text-white/70">
              Confirmation
            </Label>
            <Input
              id="fan-password-confirm"
              name="password_confirm"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            isPending={pending}
            variant="outline"
            className="h-11 rounded-full border-white/20 bg-transparent px-6 text-white"
          >
            Mettre à jour
          </Button>
        </div>
      </form>
    </Section>
  );
}

function SessionSection() {
  return (
    <Section title="Session">
      <form action={signOut}>
        <Button
          type="submit"
          variant="outline"
          className="h-11 rounded-full border-white/20 bg-transparent px-6 text-white"
        >
          Se déconnecter
        </Button>
      </form>
    </Section>
  );
}

const DELETE_REASONS = [
  { id: "not_using", label: "Je n'utilise plus Gootunes" },
  { id: "privacy", label: "Confidentialité" },
  { id: "too_expensive", label: "Trop cher" },
  { id: "missing_features", label: "Il manque des fonctionnalités" },
  { id: "other", label: "Autre" },
] as const;

function DeleteAccountSection() {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onConfirm() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/account/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, details }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          toastError(data.error || "Suppression impossible.");
          return;
        }
        router.replace("/");
        router.refresh();
      } catch {
        toastError("Suppression impossible.", "Vérifie ta connexion.");
      }
    });
  }

  return (
    <Section
      title="Supprimer le compte"
      description="Action définitive : tes achats, ta bibliothèque et tes playlists seront perdus."
      tone="danger"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {DELETE_REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setReason(r.id)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                reason === r.id
                  ? "border-white bg-white text-black"
                  : "border-white/15 text-white/60 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Un mot pour nous aider à progresser (facultatif)"
          className="rounded-2xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
        />
        <div>
          <Button
            type="button"
            isDisabled={!reason}
            onPress={() => setConfirmOpen(true)}
            className="h-11 rounded-full bg-red-500 px-6 font-semibold text-white"
          >
            Supprimer mon compte
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Supprimer définitivement ?"
        description="Ton compte et toutes tes données seront supprimés. Cette action est irréversible."
        confirmLabel="Supprimer"
        isPending={pending}
        onConfirm={onConfirm}
      />
    </Section>
  );
}
