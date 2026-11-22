import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { getObjectFromR2, uploadObjectToR2 } from "@/lib/r2";

const run = promisify(execFile);

/** Tag vocal Gootunes posé sur chaque démo de prod. */
const TAG_FILE = path.join(process.cwd(), "assets", "prods-tag.mp3");

/** Secondes entre deux tags (réglable par PRODS_TAG_INTERVAL). */
function interval(): number {
  const v = Number(process.env.PRODS_TAG_INTERVAL || 5);
  return Number.isFinite(v) && v >= 3 && v <= 60 ? v : 5;
}

/** Durée de la démo publique, en secondes (réglable par PRODS_DEMO_SECONDS). */
function demoSeconds(): number {
  const v = Number(process.env.PRODS_DEMO_SECONDS || 60);
  return Number.isFinite(v) && v >= 15 && v <= 600 ? v : 60;
}

/** Volume du tag par rapport au beat (réglable par PRODS_TAG_VOLUME). */
function tagVolume(): number {
  const v = Number(process.env.PRODS_TAG_VOLUME || 1.3);
  return Number.isFinite(v) && v > 0 && v <= 4 ? v : 1.3;
}

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

/**
 * Démo publique d'une prod : extrait des `demoSeconds` premières secondes,
 * tag Gootunes à 1 s puis toutes les `interval` secondes, fondu final.
 * Sortie MP3 192 kb/s.
 */
export async function watermarkMp3(input: Buffer): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), "gt-tag-"));
  try {
    const src = path.join(dir, "in.mp3");
    const out = path.join(dir, "out.mp3");
    await writeFile(src, input);

    const every = interval();
    const limit = demoSeconds();
    const rate = 44100;
    const filter = [
      `[1:a]aformat=sample_rates=${rate}:channel_layouts=stereo,volume=${tagVolume()},` +
        `apad=whole_dur=${every},atrim=0:${every},` +
        `aloop=loop=-1:size=${every * rate},adelay=1000|1000[tag]`,
      `[0:a]aformat=sample_rates=${rate}:channel_layouts=stereo[beat]`,
      // Extrait limité à `demoSeconds` avec un fondu de 3 s à la fin.
      `[beat][tag]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.97,` +
        `atrim=0:${limit},afade=t=out:st=${limit - 3}:d=3[out]`,
    ].join(";");

    await run(
      FFMPEG,
      [
        "-hide_banner", "-loglevel", "error", "-y",
        "-i", src,
        "-i", TAG_FILE,
        "-filter_complex", filter,
        "-map", "[out]",
        "-map_metadata", "-1",
        "-c:a", "libmp3lame", "-b:a", "192k",
        out,
      ],
      { timeout: 180_000, maxBuffer: 4 * 1024 * 1024 },
    );
    return await readFile(out);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Lit la démo envoyée par le beatmaker sur R2, la tague et enregistre le
 * résultat sous une nouvelle clé. Renvoie la clé de la démo taguée.
 */
export async function watermarkDemoKey(sourceKey: string, ownerId: string): Promise<string> {
  const object = await getObjectFromR2({ key: sourceKey });
  if (!object.Body) throw new Error("Démo illisible");
  const bytes = Buffer.from(await object.Body.transformToByteArray());
  const tagged = await watermarkMp3(bytes);
  const key = `audios/${ownerId}/prods/${randomUUID()}-tagged.mp3`;
  await uploadObjectToR2({ key, contentType: "audio/mpeg", body: tagged });
  return key;
}
