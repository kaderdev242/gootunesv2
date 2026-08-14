"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Button, Input, Label } from "@heroui/react";
import { updateProfile, type ActionState } from "@/lib/actions/profile";
import { getCountryLabel } from "@/lib/constants";
import type { Profile } from "@/lib/supabase/database.types";
import { GenrePicker } from "@/components/genres/GenrePicker";
import { useActionToast } from "@/hooks/useActionToast";
import { uploadViaApi } from "@/lib/upload-client";
import { toastError } from "@/lib/toast";

const initial: ActionState = {};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  useActionToast(state);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [genres, setGenres] = useState<string[]>(profile.genres ?? []);

  async function onAvatarChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = (await uploadViaApi(file, "avatar")).fileUrl;
      setAvatarUrl(url);
    } catch {
      toastError("Upload impossible", "Réessaie avec une autre image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="flex max-w-lg flex-col gap-6">
      <input type="hidden" name="avatar_url" value={avatarUrl} />

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="relative size-24 overflow-hidden rounded-full border border-white/15 bg-white/5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Photo de profil"
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-lg text-white/35">
              {(profile.display_name || "G").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-white/70">Photo de profil</p>
          <label className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
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
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="display_name">Nom affiché</Label>
        <Input
          id="display_name"
          value={profile.display_name || ""}
          readOnly
          className="bg-white/5 opacity-70"
        />
        <p className="text-xs text-white/35">
          Le nom ne peut pas être modifié après l&apos;inscription.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="country">Pays</Label>
        <Input
          id="country"
          value={getCountryLabel(profile.country)}
          readOnly
          className="bg-white/5 opacity-70"
        />
        <p className="text-xs text-white/35">
          Le pays est fixé à l&apos;inscription et sert aux retraits Mobile Money.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          name="phone"
          defaultValue={profile.phone || ""}
          className="bg-white/5"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile.bio || ""}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
          placeholder="Quelques mots sur toi…"
        />
      </div>

      <GenrePicker
        label="Genres musicaux"
        value={genres}
        onChange={setGenres}
        name="genres"
        max={8}
      />

      <Button
        type="submit"
        isPending={pending || uploading}
        className="h-11 rounded-full bg-white font-semibold text-black"
      >
        Enregistrer
      </Button>
    </form>
  );
}
