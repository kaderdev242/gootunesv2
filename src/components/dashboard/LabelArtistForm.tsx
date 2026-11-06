"use client";

import { useActionState, useState } from "react";
import { AppImage } from "@/components/media/AppImage";
import { Button, Input, Label } from "@heroui/react";
import { createLabelArtist } from "@/lib/actions/label";
import type { ActionState } from "@/lib/actions/profile";
import { CountrySelect } from "@/components/auth/CountrySelect";
import { useDefaultCountry } from "@/hooks/useDefaultCountry";
import { useActionToast } from "@/hooks/useActionToast";
import { mapUploadError } from "@/lib/errors";
import { uploadViaApi } from "@/lib/upload-client";
import { toastError } from "@/lib/toast";

const initial: ActionState = {};

export function LabelArtistForm() {
  const [state, action, pending] = useActionState(createLabelArtist, initial);
  useActionToast(state);
  const { country, setCountry } = useDefaultCountry();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  async function onAvatarChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toastError("Fichier image requis.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError("Photo max 5 Mo.");
      return;
    }
    setUploading(true);
    try {
      const url = (await uploadViaApi(file, "avatar")).fileUrl;
      setAvatarUrl(url);
    } catch (e) {
      toastError(mapUploadError(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-4 studio-card p-5"
    >
      <h2 className="text-lg font-semibold">Ajouter un artiste</h2>
      <p className="text-xs text-white/50">Tous les champs sont obligatoires.</p>

      <input type="hidden" name="avatar_url" value={avatarUrl} />

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="relative size-20 overflow-hidden rounded-full border border-white/10 bg-[#1a1a1a]">
          {avatarUrl ? (
            <AppImage
              src={avatarUrl}
              alt="Photo artiste"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-white/40">
              Photo
            </div>
          )}
        </div>
        <div>
          <Label>Photo de profil</Label>
          <label className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-full border border-white/10 bg-[#0f0f10] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.06]">
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
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="stage_name">Nom de scène</Label>
        <Input
          id="stage_name"
          name="stage_name"
          required
          className="bg-[#1a1a1a]"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="country">Pays</Label>
        <CountrySelect id="country" value={country} onChange={setCountry} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          required
          rows={3}
          className="rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-3 py-2 text-sm text-white outline-none focus:border-white/20"
          placeholder="Présentation de l'artiste…"
        />
      </div>
      <Button
        type="submit"
        isPending={pending || uploading}
        isDisabled={!avatarUrl || uploading}
        className="rounded-full bg-white hover:bg-white/90 font-semibold text-black"
      >
        Ajouter
      </Button>
    </form>
  );
}
