"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Input, Label } from "@heroui/react";
import { AppImage } from "@/components/media/AppImage";
import { GenrePicker } from "@/components/genres/GenrePicker";
import { StepHeader } from "@/components/dashboard/publish/StepHeader";
import { UploadBusy } from "@/components/dashboard/publish/UploadBusy";
import type { ActionState } from "@/lib/actions/profile";
import type { CreatorBase } from "@/lib/dashboard/paths";
import { mapUploadError, toUserError } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import {
  COVER_SIZE,
  isMp3File,
  readAudioDuration,
  validateCoverFile,
} from "@/lib/media-validation";
import { createBeat } from "@/lib/prods/actions";
import {
  BEAT_FILE_TYPES,
  LICENSE_ORDER,
  LICENSES,
  MIN_BEAT_PRICE_FCFA,
  MOODS,
  MUSICAL_KEYS,
  type BeatFileKind,
} from "@/lib/prods/constants";
import { uploadBeatFile } from "@/lib/prods/upload-client";
import { computeWaveform } from "@/lib/prods/waveform";
import { toastError } from "@/lib/toast";
import { uploadViaApi } from "@/lib/upload-client";
import type { Artist, BeatLicense } from "@/lib/supabase/database.types";

const initial: ActionState = {};
const TOTAL = 5;

type FileSlot = { key: string; name: string } | null;

const LICENSE_FILE: Record<BeatLicense, Exclude<BeatFileKind, "demo">> = {
  mp3: "mp3",
  wav: "wav",
  stems: "stems",
};

const DEFAULT_PRICES: Record<BeatLicense, string> = {
  mp3: "10000",
  wav: "25000",
  stems: "50000",
};

export function BeatPublishWizard({
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
  const [genre, setGenre] = useState<string | null>("Afrobeats");
  const [mood, setMood] = useState("");
  const [bpm, setBpm] = useState("");
  const [musicalKey, setMusicalKey] = useState("");
  const [tags, setTags] = useState("");
  const [producteur, setProducteur] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [files, setFiles] = useState<Record<BeatFileKind, FileSlot>>({
    demo: null,
    mp3: null,
    wav: null,
    stems: null,
  });
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[] | null>(null);
  const [enabled, setEnabled] = useState<Record<BeatLicense, boolean>>({
    mp3: true,
    wav: true,
    stems: false,
  });
  const [prices, setPrices] = useState<Record<BeatLicense, string>>(DEFAULT_PRICES);
  const [ownershipCertified, setOwnershipCertified] = useState(false);
  const [busy, setBusy] = useState<BeatFileKind | "cover" | null>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [state, action, pending] = useActionState(createBeat, initial);
  const allowSubmitRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (localError) toastError(localError);
  }, [localError]);
  useEffect(() => {
    if (state.error) toastError(toUserError(state.error));
  }, [state.error]);

  const uploading = busy !== null;

  function priceOf(l: BeatLicense): number | null {
    if (!enabled[l]) return null;
    const n = Number(prices[l]);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }

  function validateStep(index: number) {
    if (index === 0) {
      if (!title.trim()) return "Titre de la prod obligatoire.";
      if (!artistId) return "Artiste obligatoire.";
      if (!genre) return "Genre obligatoire.";
      if (bpm && (Number(bpm) < 40 || Number(bpm) > 300)) return "BPM entre 40 et 300.";
    }
    if (index === 1 && !coverUrl) return `Cover ${COVER_SIZE}×${COVER_SIZE} obligatoire.`;
    if (index === 2 && !files.demo) return "La démo taguée est obligatoire : c'est l'aperçu public.";
    if (index === 3) {
      if (!LICENSE_ORDER.some((l) => enabled[l])) return "Active au moins une licence.";
      for (const l of LICENSE_ORDER) {
        if (!enabled[l]) continue;
        const p = priceOf(l);
        if (!p || p < MIN_BEAT_PRICE_FCFA) {
          return `${LICENSES[l].name} : prix minimum ${MIN_BEAT_PRICE_FCFA} FCFA.`;
        }
        if (!files[LICENSE_FILE[l]]) {
          return `${LICENSES[l].name} : ajoute le fichier ${BEAT_FILE_TYPES[LICENSE_FILE[l]].label} (étape Fichiers).`;
        }
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
    setBusy("cover");
    setLocalError(null);
    try {
      await validateCoverFile(file);
      const url = (await uploadViaApi(file, "cover")).fileUrl;
      setCoverUrl(url);
      setCoverPreview(URL.createObjectURL(file));
    } catch (e) {
      setLocalError(mapUploadError(e));
    } finally {
      setBusy(null);
    }
  }

  async function onFile(kind: BeatFileKind, file: File | null) {
    if (!file) return;
    setLocalError(null);
    if ((kind === "demo" || kind === "mp3") && !isMp3File(file)) {
      setLocalError("Format attendu : MP3.");
      return;
    }
    setBusy(kind);
    setPercent(0);
    try {
      const [key, dur, peaks] = await Promise.all([
        uploadBeatFile(file, kind, setPercent),
        kind === "demo" ? readAudioDuration(file) : Promise.resolve(0),
        kind === "demo" ? computeWaveform(file) : Promise.resolve(null),
      ]);
      setFiles((f) => ({ ...f, [kind]: { key, name: file.name } }));
      if (kind === "demo" && dur) setDuration(Math.round(dur));
      if (kind === "demo") setWaveform(peaks);
      if (kind !== "demo") {
        const lic = (Object.keys(LICENSE_FILE) as BeatLicense[]).find((l) => LICENSE_FILE[l] === kind);
        if (lic) setEnabled((e) => ({ ...e, [lic]: true }));
      }
    } catch (e) {
      setLocalError(mapUploadError(e));
    } finally {
      setBusy(null);
      setPercent(null);
    }
  }

  const artistName = artists.find((a) => a.id === artistId)?.stage_name || "—";

  const slots: { kind: BeatFileKind; title: string; hint: string }[] = [
    { kind: "demo", title: "Démo avec ton tag", hint: "MP3 · aperçu public, écouté sur la vitrine" },
    { kind: "mp3", title: "MP3 sans tag", hint: "Livré avec la licence MP3" },
    { kind: "wav", title: "WAV sans tag", hint: "Livré avec les licences WAV et Stems · max 95 Mo" },
    { kind: "stems", title: "Stems (ZIP)", hint: "Pistes séparées · licence Stems · max 95 Mo" },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-white/40">Instrumental</p>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[34px]">
            Publier une prod
          </h1>
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
        <input type="hidden" name="title" value={title} />
        <input type="hidden" name="artist_id" value={artistId} />
        <input type="hidden" name="cover_url" value={coverUrl} />
        <input type="hidden" name="genre" value={genre || ""} />
        <input type="hidden" name="mood" value={mood} />
        <input type="hidden" name="bpm" value={bpm} />
        <input type="hidden" name="musical_key" value={musicalKey} />
        <input type="hidden" name="tags" value={tags} />
        <input type="hidden" name="producteur" value={producteur} />
        <input type="hidden" name="demo_key" value={files.demo?.key || ""} />
        <input type="hidden" name="duration_seconds" value={duration || ""} />
        <input type="hidden" name="waveform" value={waveform ? JSON.stringify(waveform) : ""} />
        <input type="hidden" name="mp3_key" value={files.mp3?.key || ""} />
        <input type="hidden" name="wav_key" value={files.wav?.key || ""} />
        <input type="hidden" name="stems_key" value={files.stems?.key || ""} />
        {LICENSE_ORDER.map((l) => (
          <input key={l} type="hidden" name={`price_${l}_fcfa`} value={priceOf(l) ?? ""} />
        ))}
        <input type="hidden" name="ownership_certified" value={ownershipCertified ? "true" : "false"} />

        {step === 0 ? (
          <>
            <StepHeader step={0} total={TOTAL} title="Infos de la prod" subtitle="Titre, beatmaker, genre et ambiance." />
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Titre de la prod</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-2xl bg-[#0f0f10]" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Beatmaker</Label>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label>BPM</Label>
                  <Input
                    inputMode="numeric"
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="ex. 98"
                    className="h-12 rounded-2xl bg-[#0f0f10]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Tonalité</Label>
                  <select
                    value={musicalKey}
                    onChange={(e) => setMusicalKey(e.target.value)}
                    className="h-12 rounded-2xl border border-white/10 bg-[#0f0f10] px-3 text-sm text-white"
                  >
                    <option value="" className="bg-[#121212]">—</option>
                    {MUSICAL_KEYS.map((k) => (
                      <option key={k} value={k} className="bg-[#121212]">{k}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Ambiance</Label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood((cur) => (cur === m ? "" : m))}
                      className={`rounded-full px-3.5 py-1.5 text-[13px] transition ${
                        mood === m ? "bg-white text-black" : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1]"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <GenrePicker mode="single" label="Genre" value={genre} onChange={setGenre} />
              <div className="flex flex-col gap-2">
                <Label>Tags (séparés par des virgules)</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="ex. type beat, ndombolo, amapiano"
                  className="h-12 rounded-2xl bg-[#0f0f10]"
                />
              </div>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <StepHeader step={1} total={TOTAL} title="Cover" subtitle={`Une cover carrée ${COVER_SIZE}×${COVER_SIZE}.`} />
            <div className="flex flex-col items-center gap-4">
              <div className="relative size-48 overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a]" aria-busy={busy === "cover"}>
                {coverPreview || coverUrl ? (
                  <AppImage src={coverPreview || coverUrl} alt="Cover" fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-white/40">
                    {COVER_SIZE}×{COVER_SIZE}
                  </div>
                )}
                {busy === "cover" ? <UploadBusy overlay label="Envoi de la cover…" /> : null}
              </div>
              <label
                className={`inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 ${
                  uploading ? "pointer-events-none opacity-60" : "cursor-pointer"
                }`}
              >
                {coverUrl ? "Changer la cover" : "Ajouter la cover"}
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
              title="Fichiers"
              subtitle="La démo taguée sert d'aperçu. Les fichiers sans tag ne sont livrés qu'après achat."
            />
            <div className="flex flex-col gap-3">
              {slots.map((s) => {
                const slot = files[s.kind];
                const isBusy = busy === s.kind;
                return (
                  <label
                    key={s.kind}
                    className={`flex items-center gap-4 rounded-2xl border px-4 py-4 transition ${
                      slot ? "border-white/15 bg-white/[0.04]" : "border-dashed border-white/10"
                    } ${uploading ? "pointer-events-none" : "cursor-pointer hover:bg-white/[0.03]"}`}
                    aria-busy={isBusy}
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-semibold ${
                        slot ? "bg-white text-black" : "bg-white/[0.06] text-white/50"
                      }`}
                    >
                      {BEAT_FILE_TYPES[s.kind].label}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white">
                        {s.title}
                        {s.kind === "demo" ? <span className="ml-1 text-white/40">*</span> : null}
                      </span>
                      {isBusy ? (
                        <UploadBusy label="Envoi…" percent={percent} />
                      ) : (
                        <span className="block truncate text-xs text-white/45">{slot ? slot.name : s.hint}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs font-medium text-white/60">{slot ? "Remplacer" : "Ajouter"}</span>
                    <input
                      type="file"
                      accept={BEAT_FILE_TYPES[s.kind].accept}
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => onFile(s.kind, e.target.files?.[0] || null)}
                    />
                  </label>
                );
              })}
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <StepHeader step={3} total={TOTAL} title="Licences & prix" subtitle="Fixe un prix par licence. L'acheteur choisit." />
            <div className="flex flex-col gap-3">
              {LICENSE_ORDER.map((l) => {
                const hasFile = Boolean(files[LICENSE_FILE[l]]);
                return (
                  <div
                    key={l}
                    className={`rounded-2xl border p-4 transition ${
                      enabled[l] ? "border-white/15 bg-white/[0.04]" : "border-white/[0.06] bg-[#0f0f10]"
                    }`}
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={enabled[l]}
                        onChange={(e) => setEnabled((s) => ({ ...s, [l]: e.target.checked }))}
                        className="size-4 rounded border-white/20 bg-transparent"
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-white">{LICENSES[l].name}</span>
                        <span className="block text-xs text-white/45">{LICENSES[l].perks.join(" · ")}</span>
                      </span>
                    </label>
                    {enabled[l] ? (
                      <div className="mt-3 flex items-center gap-3 pl-7">
                        <Input
                          inputMode="numeric"
                          value={prices[l]}
                          onChange={(e) =>
                            setPrices((p) => ({ ...p, [l]: e.target.value.replace(/\D/g, "").slice(0, 7) }))
                          }
                          className="h-11 w-36 rounded-xl bg-[#0f0f10]"
                          aria-label={`Prix ${LICENSES[l].name} en FCFA`}
                        />
                        <span className="text-xs text-white/45">FCFA</span>
                        {!hasFile ? (
                          <span className="ml-auto text-xs text-amber-200/80">
                            Fichier {BEAT_FILE_TYPES[LICENSE_FILE[l]].label} manquant
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              <div className="mt-2 flex flex-col gap-2">
                <Label>Producteur (crédit)</Label>
                <Input
                  value={producteur}
                  onChange={(e) => setProducteur(e.target.value)}
                  placeholder={artistName}
                  className="bg-[#0f0f10]"
                />
              </div>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <StepHeader step={4} total={TOTAL} title="Récapitulatif" subtitle="Vérifie les infos puis certifie ta propriété." />
            <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-[#1a1a1a] p-4 text-sm">
              <div className="flex gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-[#0f0f10]">
                  {coverUrl ? <AppImage src={coverUrl} alt="" fill className="object-cover" unoptimized /> : null}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold text-white">{title || "—"}</p>
                  <p className="text-white/50">
                    {artistName}
                    {genre ? ` · ${genre}` : ""}
                  </p>
                  <p className="text-white/50">
                    {[bpm && `${bpm} BPM`, musicalKey, mood].filter(Boolean).join(" · ") || "Instrumental"}
                  </p>
                </div>
              </div>
              <ul className="space-y-1 border-t border-white/[0.06] pt-3 text-xs text-white/60">
                {LICENSE_ORDER.filter((l) => enabled[l]).map((l) => (
                  <li key={l} className="flex justify-between">
                    <span>{LICENSES[l].name}</span>
                    <span className="font-medium text-white">{formatMoney(priceOf(l) || 0, country)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.06] bg-[#0f0f10] p-4">
              <input
                type="checkbox"
                checked={ownershipCertified}
                onChange={(e) => setOwnershipCertified(e.target.checked)}
                className="mt-1 size-4 rounded border-white/20 bg-transparent"
              />
              <span className="text-sm leading-relaxed text-white/85">
                Je certifie être l&apos;auteur de cette prod, que les samples utilisés sont libres de droits ou
                autorisés, et que sa vente ne porte atteinte à aucun droit de tiers.
              </span>
            </label>
          </>
        ) : null}

        {(localError || state.error) && (
          <p className="mt-4 rounded-2xl bg-red-500/10 px-3 py-2 text-sm text-red-400">{localError || state.error}</p>
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
              className="h-12 flex-1 rounded-full bg-white font-semibold text-black hover:bg-white/90"
              onPress={next}
              isDisabled={uploading}
            >
              Continuer
            </Button>
          ) : (
            <Button
              type="button"
              isPending={pending || uploading}
              isDisabled={!ownershipCertified}
              className="h-12 flex-1 rounded-full bg-white font-semibold text-black hover:bg-white/90"
              onPress={() => {
                for (let i = 0; i < TOTAL - 1; i++) {
                  const err = validateStep(i);
                  if (err) {
                    setLocalError(err);
                    setStep(i);
                    return;
                  }
                }
                allowSubmitRef.current = true;
                formRef.current?.requestSubmit();
              }}
            >
              Publier la prod
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
