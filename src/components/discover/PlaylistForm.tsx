"use client";

import { useActionState, useEffect, useState } from "react";
import { AppImage } from "@/components/media/AppImage";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { createPlaylist, updatePlaylist } from "@/lib/actions/playlists";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";
import { mapUploadError } from "@/lib/errors";
import { toastError } from "@/lib/toast";
import { uploadViaApi } from "@/lib/upload-client";
import { COVER_SIZE, validateCoverFile } from "@/lib/media-validation";
import { FALLBACK_COVER } from "@/lib/types/music";

const initial: ActionState = {};

export function PlaylistForm({
  mode = "create",
  playlistId,
  initialTitle = "",
  initialDescription = "",
  initialCover = "",
  initialIsPublic = false,
}: {
  mode?: "create" | "edit";
  playlistId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialCover?: string;
  initialIsPublic?: boolean;
}) {
  const router = useRouter();
  const action = mode === "edit" ? updatePlaylist : createPlaylist;
  const [state, formAction, pending] = useActionState(action, initial);
  useActionToast(state);

  const [coverUrl, setCoverUrl] = useState(initialCover);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (mode === "create" && state?.actionHref) {
      router.replace(state.actionHref);
    }
  }, [mode, router, state?.actionHref]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {mode === "edit" && playlistId ? (
        <input type="hidden" name="playlist_id" value={playlistId} />
      ) : null}
      <input type="hidden" name="cover_url" value={coverUrl} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="mx-auto w-full max-w-[180px] shrink-0 sm:mx-0">
        <label className="relative block aspect-square w-full cursor-pointer overflow-hidden rounded-2xl border border-white/15 bg-zinc-900">
          <AppImage
            src={coverUrl || FALLBACK_COVER}
            alt=""
            fill
            className="object-cover"
            sizes="180px"
          />
          <span className="absolute inset-x-0 bottom-0 bg-black/55 py-2 text-center text-xs text-white">
            {uploading ? "Envoi…" : coverUrl ? "Changer" : "Cover"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading || pending}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                await validateCoverFile(file);
              } catch (err) {
                toastError(err instanceof Error ? err.message : "Cover invalide.");
                e.target.value = "";
                return;
              }
              setUploading(true);
              try {
                const url = (await uploadViaApi(file, "cover")).fileUrl;
                setCoverUrl(url);
              } catch (err) {
                toastError(mapUploadError(err));
              } finally {
                setUploading(false);
                e.target.value = "";
              }
            }}
          />
        </label>
        <p className="mt-2 text-center text-[12px] text-white/40">
          Image carrée {COVER_SIZE}×{COVER_SIZE} px
        </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-white/45">Titre</label>
            <input
              name="title"
              required
              maxLength={80}
              defaultValue={initialTitle}
              placeholder="Ma playlist"
              className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-white/45">
              Description
            </label>
            <textarea
              name="description"
              maxLength={400}
              rows={3}
              defaultValue={initialDescription}
              placeholder="Ambiance, moment, mood…"
              className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25"
            />
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <input
          type="checkbox"
          name="is_public"
          value="true"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="mt-1 size-4 rounded border-white/30 bg-black/40 accent-white"
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-white">
            Rendre publique
          </span>
          <span className="mt-0.5 block text-xs text-white/45">
            Visible dans Discover et partageable via un lien.
          </span>
        </span>
      </label>

      <Button
        type="submit"
        isPending={pending || uploading}
        className="rounded-full bg-white font-semibold text-black"
      >
        {mode === "edit" ? "Enregistrer" : "Créer la playlist"}
      </Button>
    </form>
  );
}
