"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { AppImage } from "@/components/media/AppImage";
import { Button, Input, Label, TextArea } from "@heroui/react";
import { CountrySelect } from "@/components/auth/CountrySelect";
import { GenrePicker } from "@/components/genres/GenrePicker";
import { useDefaultCountry } from "@/hooks/useDefaultCountry";
import { completeOnboarding, type OnboardingState } from "@/lib/actions/onboarding";
import { mapUploadError, toUserError } from "@/lib/errors";
import { uploadViaApi } from "@/lib/upload-client";
import { toastError } from "@/lib/toast";
import type { UserRole } from "@/lib/supabase/database.types";

const initial: OnboardingState = {};

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export type OnboardingDefaults = {
  displayName?: string;
  phone?: string;
  country?: string;
  genres?: string[];
  avatarUrl?: string;
};

export function OnboardingWizard({
  role,
  conversion = false,
  defaults,
}: {
  role: Extract<UserRole, "artist" | "label">;
  /** Fan qui devient artiste / label : le rôle change à la validation */
  conversion?: boolean;
  defaults?: OnboardingDefaults;
}) {
  const [step, setStep] = useState(0);
  const { country, setCountry } = useDefaultCountry(defaults?.country);
  const [displayName, setDisplayName] = useState(defaults?.displayName ?? "");
  const [phone, setPhone] = useState(defaults?.phone ?? "");
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState<string[]>(defaults?.genres ?? []);
  const [avatarUrl, setAvatarUrl] = useState(defaults?.avatarUrl ?? "");

  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, action, pending] = useActionState(completeOnboarding, initial);

  useEffect(() => {
    if (localError) toastError(localError);
  }, [localError]);
  useEffect(() => {
    if (state.error) toastError(toUserError(state.error));
  }, [state.error]);

  const words = useMemo(() => countWords(bio), [bio]);
  const nameLabel = role === "label" ? "Nom du label" : "Nom de scène";

  function validateStep(index: number) {
    setLocalError(null);
    if (index === 0) {
      if (!displayName.trim()) return "Le nom est obligatoire.";
      if (!phone.trim()) return "Le téléphone est obligatoire.";
      if (!country) return "Le pays est obligatoire.";
    }
    if (index === 1) {
      if (!bio.trim()) return "La description est obligatoire.";
      if (words > 60) return "60 mots maximum.";
      if (!genres.length) return "Choisis au moins un genre.";
    }
    if (index === 2) {
      if (!avatarUrl) return "Ajoute une photo de profil.";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setLocalError(err);
      return;
    }
    setStep((s) => Math.min(2, s + 1));
  }

  async function onAvatarChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Fichier image requis.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLocalError("Photo max 5 Mo.");
      return;
    }
    setUploading(true);
    setLocalError(null);
    try {
      const url = (await uploadViaApi(file, "avatar")).fileUrl;
      setAvatarUrl(url);
    } catch (e) {
      setLocalError(mapUploadError(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              i <= step ? "bg-white" : "bg-white/15"
            }`}
          />
        ))}
      </div>

      <p className="text-[11px] font-semibold tracking-[0.18em] text-white/35 uppercase">
        Étape {step + 1} / 3
      </p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-white">
        {step === 0 && "Ton identité"}
        {step === 1 && "Ton univers"}
        {step === 2 && "Ta photo"}
      </h1>
      <p className="mt-2 text-sm text-white/45">
        {step === 0 && "Ces infos apparaissent sur ton profil public."}
        {step === 1 && "Description courte + genres que tu incarnes."}
        {step === 2 && "Une photo claire pour que les fans te reconnaissent."}
      </p>

      <form action={action} className="mt-8 flex flex-col gap-5">
        <input type="hidden" name="display_name" value={displayName} />
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="bio" value={bio} />
        <input type="hidden" name="avatar_url" value={avatarUrl} />
        <input type="hidden" name="genres" value={genres.join(",")} />
        <input type="hidden" name="country" value={country} />
        {conversion ? (
          <input type="hidden" name="target_role" value={role} />
        ) : null}

        {step === 0 ? (
          <>
            <div className="flex flex-col gap-2">
              <Label className="text-white/70">{nameLabel}</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder={
                  role === "label" ? "Ex. Empire Sounds" : "Ex. DJ Kuba"
                }
                className="h-12 rounded-2xl border-white/12 bg-white/[0.04]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-white/70">Pays</Label>
              <CountrySelect value={country} onChange={setCountry} />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-white/70">Téléphone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                type="tel"
                placeholder="+242 06 000 00 00"
                className="h-12 rounded-2xl border-white/12 bg-white/[0.04]"
              />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-white/70">Description courte</Label>
                <span
                  className={`text-xs ${words > 60 ? "text-red-300" : "text-white/35"}`}
                >
                  {words}/60 mots
                </span>
              </div>
              <TextArea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
                rows={4}
                placeholder="Présente-toi en quelques mots…"
                className="rounded-2xl border-white/12 bg-white/[0.04]"
              />
            </div>
            <GenrePicker
              label="Genres de musique"
              value={genres}
              onChange={setGenres}
            />
          </>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col items-center gap-5">
            <div className="relative size-36 overflow-hidden rounded-full border border-white/15 bg-white/5">
              {avatarUrl ? (
                <AppImage
                  src={avatarUrl}
                  alt="Photo de profil"
                  fill
                  className="object-cover"
                  sizes="144px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/35">
                  Aperçu
                </div>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black">
              {uploading ? "Envoi…" : avatarUrl ? "Changer la photo" : "Ajouter une photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => onAvatarChange(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        ) : null}

        {(localError || state.error) && (
          <p className="rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {localError || state.error}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-full border-white/20 bg-transparent text-white"
              onPress={() => {
                setLocalError(null);
                setStep((s) => s - 1);
              }}
            >
              Retour
            </Button>
          ) : null}

          {step < 2 ? (
            <Button
              type="button"
              className="h-12 flex-1 rounded-full bg-white font-semibold text-black"
              onPress={next}
            >
              Continuer
            </Button>
          ) : (
            <Button
              type="submit"
              isPending={pending || uploading}
              isDisabled={!avatarUrl || uploading}
              className="h-12 flex-1 rounded-full bg-white font-semibold text-black"
            >
              {conversion
                ? `Devenir ${role === "label" ? "label" : "artiste"}`
                : "Terminer & accéder"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
