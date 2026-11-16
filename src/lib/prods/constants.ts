import type { BeatLicense } from "@/lib/supabase/database.types";

/** Domaine public de la vitrine prods (le site principal reste www). */
export const PRODS_HOST = "prod.gootunes.com";
export const MAIN_ORIGIN = "https://www.gootunes.com";

/** Préfixe des commandes de prods (dispatch webhook Mbiyo). */
export const BEAT_ORDER_PREFIX = "BT-";

/** Le plafond d'un Worker Cloudflare (100 Mo) moins une marge. */
export const MAX_BEAT_FILE_BYTES = 95 * 1024 * 1024;
export const MAX_DEMO_BYTES = 50 * 1024 * 1024;

export const MIN_BEAT_PRICE_FCFA = 500;
export const MAX_BEAT_PRICE_FCFA = 5_000_000;

export type BeatFileKind = "demo" | "mp3" | "wav" | "stems";

export const BEAT_FILE_TYPES: Record<
  BeatFileKind,
  { contentType: string; ext: string; accept: string; maxBytes: number; label: string }
> = {
  demo: { contentType: "audio/mpeg", ext: "mp3", accept: "audio/mpeg,.mp3", maxBytes: MAX_DEMO_BYTES, label: "MP3" },
  mp3: { contentType: "audio/mpeg", ext: "mp3", accept: "audio/mpeg,.mp3", maxBytes: MAX_DEMO_BYTES, label: "MP3" },
  wav: { contentType: "audio/wav", ext: "wav", accept: "audio/wav,audio/x-wav,.wav", maxBytes: MAX_BEAT_FILE_BYTES, label: "WAV" },
  stems: { contentType: "application/zip", ext: "zip", accept: "application/zip,application/x-zip-compressed,.zip", maxBytes: MAX_BEAT_FILE_BYTES, label: "ZIP" },
};

export const LICENSES: Record<
  BeatLicense,
  { name: string; files: ("mp3" | "wav" | "stems")[]; perks: string[] }
> = {
  mp3: {
    name: "Licence MP3",
    files: ["mp3"],
    perks: ["MP3 sans tag", "Usage non exclusif", "Streaming et clips"],
  },
  wav: {
    name: "Licence WAV",
    files: ["wav", "mp3"],
    perks: ["WAV haute qualité sans tag", "MP3 inclus si fourni", "Usage non exclusif"],
  },
  stems: {
    name: "Licence Stems",
    files: ["stems", "wav", "mp3"],
    perks: ["Pistes séparées (ZIP)", "WAV et MP3 inclus", "Mixage complet en studio"],
  },
};

export const LICENSE_ORDER: BeatLicense[] = ["mp3", "wav", "stems"];

export const MUSICAL_KEYS = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
].flatMap((n) => [`${n} maj`, `${n} min`]);

export const MOODS = [
  "Énergique", "Sombre", "Mélancolique", "Joyeux", "Romantique",
  "Chill", "Épique", "Agressif", "Festif", "Spirituel",
];

export function beatPriceFor(
  beat: { price_mp3_fcfa: number | null; price_wav_fcfa: number | null; price_stems_fcfa: number | null },
  license: BeatLicense,
): number | null {
  const v =
    license === "mp3" ? beat.price_mp3_fcfa : license === "wav" ? beat.price_wav_fcfa : beat.price_stems_fcfa;
  return v === null || v === undefined ? null : Number(v);
}

export function lowestBeatPrice(beat: Parameters<typeof beatPriceFor>[0]): number | null {
  const prices = LICENSE_ORDER.map((l) => beatPriceFor(beat, l)).filter(
    (p): p is number => p !== null,
  );
  return prices.length ? Math.min(...prices) : null;
}

export function isBeatLicense(v: string): v is BeatLicense {
  return v === "mp3" || v === "wav" || v === "stems";
}

/**
 * URL publique de la vitrine. Tant que le DNS de prod.gootunes.com n'est pas en place,
 * on reste sur www.gootunes.com/prods (NEXT_PUBLIC_PRODS_URL non définie).
 */
export function prodsPublicUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_PRODS_URL || "/prods").replace(/\/$/, "");
  return `${base}${path}`;
}
