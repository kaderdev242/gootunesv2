"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { AppImage } from "@/components/media/AppImage";
import Link from "next/link";
import { Button, Input, Label } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { GenrePicker } from "@/components/genres/GenrePicker";
import { StepHeader } from "@/components/dashboard/publish/StepHeader";
import { PriceTierPicker } from "@/components/dashboard/publish/PriceTierPicker";
import { UploadBusy } from "@/components/dashboard/publish/UploadBusy";
import { createRelease } from "@/lib/actions/publish";
import { formatMoney } from "@/lib/format";
import {
  DEFAULT_ALBUM_PRICE_FCFA,
  isReleasePriceTier,
} from "@/lib/purchases/apple-tiers";
import type { ActionState } from "@/lib/actions/profile";
import type { CreatorBase } from "@/lib/dashboard/paths";
import {
  COVER_SIZE,
  isMp3File,
  readAudioDuration,
  validateCoverFile,
} from "@/lib/media-validation";
import { uploadViaApi } from "@/lib/upload-client";
import { mapUploadError, toUserError } from "@/lib/errors";
import { toastError } from "@/lib/toast";
import type { Artist } from "@/lib/supabase/database.types";

const initial: ActionState = {};
const TOTAL = 5;

type TrackDraft = {
  id: string;
  title: string;
  audio_url: string;
  track_number: number;
  fileName: string;
  duration_seconds: number;
  is_explicit: boolean;
};

export function AlbumPublishWizard({
  artists,
  basePath,
  country,
}: {
  artists: Artist[];
  basePath: CreatorBase;
  country?: string | null;
}) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [artistId, setArtistId] = useState(artists[0]?.id || "");
  const [priceFcfa, setPriceFcfa] = useState(DEFAULT_ALBUM_PRICE_FCFA);
  const [genre, setGenre] = useState<string | null>("Afrobeats");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [tracks, setTracks] = useState<TrackDraft[]>([]);
  const [auteur, setAuteur] = useState("");
  const [compositeur, setCompositeur] = useState("");
  const [producteur, setProducteur] = useState("");
  const [featuring, setFeaturing] = useState("");
  const [ownershipCertified, setOwnershipCertified] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, action, pending] = useActionState(createRelease, initial);
  const allowSubmitRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (localError) toastError(localError);
  }, [localError]);
  useEffect(() => {
    if (state.error) toastError(toUserError(state.error));
  }, [state.error]);

  const tracksJson = useMemo(
    () =>
      JSON.stringify(
        tracks.map((t, i) => ({
          title: t.title,
          audio_url: t.audio_url,
          track_number: i + 1,
          duration_seconds: t.duration_seconds || null,
          is_explicit: Boolean(t.is_explicit),
        })),
      ),
    [tracks],
  );

  function validateStep(index: number) {
    if (index === 0) {
      if (!title.trim()) return "Titre de l'album obligatoire.";
      if (!artistId) return "Artiste obligatoire.";
      if (!genre) return "Genre obligatoire.";
      if (!isReleasePriceTier(priceFcfa)) {
        return "Choisis un palier de prix.";
      }
    }
    if (index === 1 && !coverUrl) return "Cover globale 1000×1000 obligatoire.";
    if (index === 2) {
      if (tracks.length < 2) return "Un album nécessite au moins 2 titres MP3.";
      if (tracks.some((t) => !t.title.trim())) {
        return "Chaque piste doit avoir un titre.";
      }
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    setStep((s) => Math.min(TOTAL - 1, s + 1));
  }

  async function onCover(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadPercent(null);
    setUploadIndex(0);
    setUploadTotal(0);
    setLocalError(null);
    try {
      await validateCoverFile(file);
      const url = (await uploadViaApi(file, "cover")).fileUrl;
      setCoverUrl(url);
      setCoverPreview(URL.createObjectURL(file));
    } catch (e) {
      const msg = mapUploadError(e);
      setLocalError(msg);
      toastError(msg);
    } finally {
      setUploading(false);
      setUploadPercent(null);
    }
  }

  async function onAudios(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploading(true);
    setUploadPercent(0);
    setUploadIndex(0);
    setUploadTotal(list.length);
    setLocalError(null);
    try {
      const nextTracks = [...tracks];
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        setUploadIndex(i + 1);
        setUploadPercent(0);
        if (!isMp3File(file)) {
          throw new Error(`« ${file.name} » n'est pas un MP3.`);
        }
        const [uploaded, browserDuration] = await Promise.all([
          uploadViaApi(file, "audio", setUploadPercent),
          readAudioDuration(file),
        ]);
        nextTracks.push({
          id: `${Date.now()}-${file.name}-${Math.random()}`,
          title: file.name.replace(/\.mp3$/i, ""),
          audio_url: uploaded.fileUrl,
          track_number: nextTracks.length + 1,
          fileName: file.name,
          duration_seconds: uploaded.durationSeconds || browserDuration,
          is_explicit: false,
        });
      }
      setTracks(nextTracks);
    } catch (e) {
      const msg = mapUploadError(e);
      setLocalError(msg);
      toastError(msg);
    } finally {
      setUploading(false);
      setUploadPercent(null);
      setUploadIndex(0);
      setUploadTotal(0);
    }
  }

  function moveTrack(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= tracks.length) return;
    const copy = [...tracks];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    setTracks(copy);
  }

  function removeTrack(index: number) {
    setTracks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTitle(index: number, value: string) {
    setTracks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, title: value } : t)),
    );
  }

  function toggleExplicit(index: number, value: boolean) {
    setTracks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, is_explicit: value } : t)),
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-white/40">
            Album
          </p>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[34px]">Publier un album</h1>
        </div>
        <Link
          href={`${basePath}/publications`}
          className="text-sm text-white/50 underline-offset-2 hover:text-white hover:underline"
        >
          Retour
        </Link>
      </div>

      <form
        ref={formRef}
        action={action}
        className="studio-card p-5 sm:p-7"
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
        onSubmit={(e) => {
          if (!allowSubmitRef.current || step !== TOTAL - 1) {
            e.preventDefault();
            return;
          }
          allowSubmitRef.current = false;
        }}
      >
        <input type="hidden" name="type" value="album" />
        <input type="hidden" name="cover_url" value={coverUrl} />
        <input type="hidden" name="tracks" value={tracksJson} />
        <input type="hidden" name="status" value="published" />
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="artist_id" value={artistId} />
        <input type="hidden" name="price_fcfa" value={priceFcfa} />
        <input type="hidden" name="genre" value={genre || ""} />
        <input type="hidden" name="auteur" value={auteur} />
        <input type="hidden" name="compositeur" value={compositeur} />
        <input type="hidden" name="producteur" value={producteur} />
        <input type="hidden" name="featuring" value={featuring} />
        <input
          type="hidden"
          name="ownership_certified"
          value={ownershipCertified ? "true" : "false"}
        />

        {step === 0 ? (
          <>
            <StepHeader
              step={0}
              total={TOTAL}
              title="Infos de l'album"
              subtitle="Titre, artiste, genre et prix global."
            />
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Titre de l&apos;album</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 rounded-2xl bg-[#0f0f10]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Artiste</Label>
                <select
                  value={artistId}
                  onChange={(e) => setArtistId(e.target.value)}
                  className="h-12 rounded-2xl border border-white/10 bg-[#0f0f10] px-3 text-sm text-white"
                >
                  {artists.map((a) => (
                    <option key={a.id} value={a.id} className="bg-[#121212] text-white">
                      {a.stage_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Prix album</Label>
                <PriceTierPicker
                  valueFcfa={priceFcfa}
                  onChange={setPriceFcfa}
                  country={country}
                />
              </div>
              <GenrePicker
                mode="single"
                label="Genre"
                value={genre}
                onChange={setGenre}
              />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <StepHeader
              step={1}
              total={TOTAL}
              title="Cover globale"
              subtitle={`Une seule cover carrée ${COVER_SIZE}×${COVER_SIZE} pour tout l'album.`}
            />
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative size-48 overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a]"
                aria-busy={uploading}
              >
                {coverPreview || coverUrl ? (
                  <AppImage
                    src={coverPreview || coverUrl}
                    alt="Cover album"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-xs text-white/40">
                    {COVER_SIZE}×{COVER_SIZE}
                  </div>
                )}
                {uploading ? (
                  <UploadBusy overlay label="Envoi de la cover…" />
                ) : null}
              </div>
              <label
                className={`inline-flex rounded-full bg-white hover:bg-white/90 px-5 py-2.5 text-sm font-semibold text-black ${
                  uploading ? "pointer-events-none opacity-60" : "cursor-pointer"
                }`}
              >
                {uploading
                  ? "Envoi…"
                  : coverUrl
                    ? "Changer la cover"
                    : "Ajouter la cover"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => onCover(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <StepHeader
              step={2}
              total={TOTAL}
              title="Titres de l'album"
              subtitle="Multi-upload MP3, renomme et réorganise l'ordre."
            />

            <label
              className={`mb-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/10 px-4 py-8 ${
                uploading ? "pointer-events-none opacity-90" : "cursor-pointer"
              }`}
              aria-busy={uploading}
            >
              {uploading ? (
                <UploadBusy
                  label={
                    uploadTotal > 1
                      ? `Envoi ${uploadIndex}/${uploadTotal}…`
                      : "Envoi du morceau…"
                  }
                  percent={uploadPercent}
                />
              ) : (
                <>
                  <span className="text-sm font-medium text-white">
                    Ajouter des MP3
                  </span>
                  <span className="text-xs text-white/50">
                    Plusieurs fichiers · .mp3
                  </span>
                </>
              )}
              <input
                type="file"
                accept="audio/mpeg,.mp3"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => onAudios(e.target.files)}
              />
            </label>

            <div className="flex flex-col gap-2">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-[#1a1a1a] p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 text-center text-xs text-white/50">
                      {index + 1}
                    </span>
                    <Input
                      value={track.title}
                      onChange={(e) => updateTitle(index, e.target.value)}
                      className="min-w-0 flex-1 bg-transparent"
                      aria-label={`Titre piste ${index + 1}`}
                    />
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="text-white/60"
                        onPress={() => moveTrack(index, -1)}
                        aria-label="Monter"
                      >
                        <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
                      </Button>
                      <Button
                        type="button"
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="text-white/60"
                        onPress={() => moveTrack(index, 1)}
                        aria-label="Descendre"
                      >
                        <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                      </Button>
                      <Button
                        type="button"
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        onPress={() => removeTrack(index)}
                        aria-label="Supprimer"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} />
                      </Button>
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 pl-9 text-xs text-white/60">
                    <input
                      type="checkbox"
                      checked={track.is_explicit}
                      onChange={(e) =>
                        toggleExplicit(index, e.target.checked)
                      }
                      className="size-3.5 rounded border-white/20 bg-transparent"
                    />
                    Explicite (paroles sensibles) — badge E
                  </label>
                </div>
              ))}
              {!tracks.length ? (
                <p className="text-center text-sm text-white/40">
                  Aucun titre pour l&apos;instant.
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <StepHeader
              step={3}
              total={TOTAL}
              title="Crédits & publication"
              subtitle={`${tracks.length} titres · cover globale prête.`}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label>Auteur</Label>
                <Input
                  value={auteur}
                  onChange={(e) => setAuteur(e.target.value)}
                  className="bg-[#0f0f10]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Compositeur</Label>
                <Input
                  value={compositeur}
                  onChange={(e) => setCompositeur(e.target.value)}
                  className="bg-[#0f0f10]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Producteur</Label>
                <Input
                  value={producteur}
                  onChange={(e) => setProducteur(e.target.value)}
                  className="bg-[#0f0f10]"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Label>Featuring</Label>
              <Input
                value={featuring}
                onChange={(e) => setFeaturing(e.target.value)}
                className="bg-[#0f0f10]"
              />
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <StepHeader
              step={4}
              total={TOTAL}
              title="Récapitulatif"
              subtitle="Vérifie les infos puis certifie ta propriété."
            />
            <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-[#1a1a1a] p-4 text-sm">
              <div className="flex gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-[#0f0f10]">
                  {coverUrl ? (
                    <AppImage
                      src={coverUrl}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold text-white">{title || "—"}</p>
                  <p className="text-white/50">
                    {artists.find((a) => a.id === artistId)?.stage_name || "—"}
                    {genre ? ` · ${genre}` : ""}
                  </p>
                  <p className="text-white/50">
                    Album · {tracks.length} titres · {formatMoney(priceFcfa, country)}
                  </p>
                </div>
              </div>
              <ul className="max-h-36 space-y-1 overflow-y-auto border-t border-white/[0.06] pt-3 text-xs text-white/50">
                {tracks.map((t, i) => (
                  <li key={t.id} className="truncate">
                    {i + 1}. {t.title || t.fileName}
                  </li>
                ))}
              </ul>
              {(auteur || compositeur || producteur || featuring) && (
                <p className="border-t border-white/[0.06] pt-3 text-xs text-white/50">
                  {[
                    auteur && `Auteur : ${auteur}`,
                    compositeur && `Compositeur : ${compositeur}`,
                    producteur && `Producteur : ${producteur}`,
                    featuring && `Feat. : ${featuring}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.06] bg-[#0f0f10] p-4">
              <input
                type="checkbox"
                checked={ownershipCertified}
                onChange={(e) => setOwnershipCertified(e.target.checked)}
                className="mt-1 size-4 rounded border-white/20 bg-transparent"
              />
              <span className="text-sm leading-relaxed text-white/85">
                Je certifie être l&apos;auteur et le propriétaire des droits des
                morceaux que je souhaite publier, et que leur mise en ligne ne
                porte atteinte à aucun droit de tiers.
              </span>
            </label>
          </>
        ) : null}

        {(localError || state.error) && (
          <p className="mt-4 rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {localError || state.error}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-full border-white/10 bg-transparent text-white"
              isDisabled={uploading}
              onPress={() => {
                setLocalError(null);
                setStep((s) => s - 1);
              }}
            >
              Retour
            </Button>
          ) : null}
          {step < TOTAL - 1 ? (
            <Button
              type="button"
              className="h-12 flex-1 rounded-full bg-white hover:bg-white/90 font-semibold text-black"
              onPress={next}
              isDisabled={uploading}
            >
              Continuer
            </Button>
          ) : (
            <Button
              type="button"
              isPending={pending || uploading}
              isDisabled={!coverUrl || tracks.length < 2 || !ownershipCertified}
              className="h-12 flex-1 rounded-full bg-white hover:bg-white/90 font-semibold text-black"
              onPress={() => {
                if (!ownershipCertified) {
                  setLocalError(
 "Coche la certification d'auteur / propriétaire pour publier.",
                  );
                  return;
                }
                allowSubmitRef.current = true;
                formRef.current?.requestSubmit();
              }}
            >
              Publier l&apos;album
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
