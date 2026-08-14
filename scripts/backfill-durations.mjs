/**
 * Backfill / correction des duration_seconds via R2 + music-metadata.
 * Usage:
 *   node --env-file=.env.local scripts/backfill-durations.mjs [limit] [mode]
 * mode = missing (défaut) | short (<90s) | all
 */
import { parseBuffer } from "music-metadata";
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const limit = Math.min(300, Math.max(1, Number(process.argv[2] || 80)));
const mode = process.argv[3] || "missing";

function extractKey(fileUrl) {
  try {
    const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    if (publicBase && fileUrl.startsWith(`${publicBase}/`)) {
      return decodeURIComponent(fileUrl.slice(publicBase.length + 1));
    }
    const url = new URL(fileUrl);
    return decodeURIComponent(url.pathname.replace(/^\//, ""));
  } catch {
    return null;
  }
}

async function sbFetch(path, options = {}) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function probe(r2, bucket, key) {
  const head = await r2.send(
    new HeadObjectCommand({ Bucket: bucket, Key: key }),
  );
  const fileSize = head.ContentLength;
  if (!fileSize || fileSize <= 0) return null;

  const end =
    fileSize < 8_000_000
      ? fileSize - 1
      : Math.min(fileSize - 1, 1_048_575);

  const obj = await r2.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: `bytes=0-${end}`,
    }),
  );
  const bytes = await obj.Body.transformToByteArray();
  const meta = await parseBuffer(
    Buffer.from(bytes),
    { mimeType: "audio/mpeg", size: fileSize },
    { duration: true },
  );
  const seconds = meta.format.duration;
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.max(1, Math.round(seconds));
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env manquant");

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secret = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKey || !secret || !bucket) {
    throw new Error("R2 env manquant");
  }

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secret },
  });

  let query =
    "tracks?select=id,audio_url,duration_seconds,title&audio_url=not.is.null";
  if (mode === "missing") {
    query += `&or=(duration_seconds.is.null,duration_seconds.eq.0)`;
  } else if (mode === "short") {
    query += `&duration_seconds=lt.90`;
  }
  query += `&limit=${limit}`;

  const tracks = await sbFetch(query);
  console.log(`Mode=${mode} À traiter: ${tracks?.length ?? 0}`);

  let updated = 0;
  let failed = 0;
  let unchanged = 0;

  for (const track of tracks ?? []) {
    const r2Key = extractKey(track.audio_url);
    if (!r2Key) {
      console.log(`SKIP ${track.id} (clé invalide)`);
      failed += 1;
      continue;
    }
    try {
      const duration = await probe(r2, bucket, r2Key);
      if (!duration) {
        console.log(`FAIL ${track.title || track.id}: durée introuvable`);
        failed += 1;
        continue;
      }
      if (track.duration_seconds === duration) {
        unchanged += 1;
        console.log(`SAME ${track.title || track.id}: ${duration}s`);
        continue;
      }
      await sbFetch(`tracks?id=eq.${track.id}`, {
        method: "PATCH",
        body: JSON.stringify({ duration_seconds: duration }),
        prefer: "return=minimal",
      });
      updated += 1;
      console.log(
        `OK ${track.title || track.id}: ${track.duration_seconds ?? "null"} → ${duration}s`,
      );
    } catch (e) {
      failed += 1;
      console.log(`ERR ${track.title || track.id}:`, e?.message || e);
    }
  }

  console.log(
    JSON.stringify({
      updated,
      unchanged,
      failed,
      scanned: tracks?.length ?? 0,
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
