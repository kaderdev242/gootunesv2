import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getBucket() {
  return process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
}

function getPublicUrl() {
  return process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
}

// Singleton — réutilise la connexion TCP/TLS entre les requêtes.
// Évite 50-150ms de handshake à chaque HEAD/GET R2.
let _r2Client: S3Client | null = null;

function getR2Client() {
  if (_r2Client) return _r2Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Configuration R2 incomplète");
  }

  _r2Client = new S3Client({
    region: "auto",
    endpoint,
    // Path-style : https://{account}.r2.cloudflarestorage.com/{bucket}/key
    // Évite gootunes-media.{account}.r2... qui casse sur certains DNS mobiles (ENOTFOUND).
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
    // Évite les checksums CRC32 qui cassent les PUT présignés R2
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    // Keepalive HTTP pour réutiliser les connexions
    requestHandler: undefined,
  });

  return _r2Client;
}

export function publicFileUrl(key: string) {
  const publicUrl = getPublicUrl();
  if (!publicUrl) {
    throw new Error(
      "URL publique R2 manquante (R2_PUBLIC_URL ou NEXT_PUBLIC_R2_PUBLIC_URL)",
    );
  }
  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}

/** Extrait la clé R2 depuis une URL publique ou une clé directe stockée en base. */
export function extractR2KeyFromUrl(fileUrl: string): string | null {
  if (!fileUrl) return null;
  try {
    const publicBase = getPublicUrl()?.replace(/\/$/, "");
    if (publicBase && fileUrl.startsWith(`${publicBase}/`)) {
      return decodeURIComponent(fileUrl.slice(publicBase.length + 1));
    }
    // Si c'est déjà une clé R2 pure (ex: "audios/userId/file.mp3") — pas une URL
    if (!fileUrl.startsWith("http://") && !fileUrl.startsWith("https://")) {
      return fileUrl;
    }
    const url = new URL(fileUrl);
    return decodeURIComponent(url.pathname.replace(/^\//, ""));
  } catch {
    return null;
  }
}

export async function headObjectFromR2(key: string) {
  const bucket = getBucket();
  if (!bucket) throw new Error("Bucket R2 manquant");
  const client = getR2Client();
  return client.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

export async function getObjectFromR2(params: {
  key: string;
  range?: string;
}) {
  const bucket = getBucket();
  if (!bucket) throw new Error("Bucket R2 manquant");
  const client = getR2Client();
  return client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Range: params.range,
    }),
  );
}

/** URL signée GET — lecture directe R2 (sans proxy octet/octet). */
export async function createPresignedGet(params: {
  key: string;
  expiresIn?: number;
  contentType?: string;
}) {
  const bucket = getBucket();
  if (!bucket) throw new Error("Bucket R2 manquant");

  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ResponseContentType: params.contentType || "audio/mpeg",
    ResponseContentDisposition: "inline",
  });

  return getSignedUrl(client, command, {
    expiresIn: params.expiresIn ?? 120,
  });
}

export async function uploadObjectToR2(params: {
  key: string;
  contentType: string;
  body: Buffer | Uint8Array;
}) {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error("Bucket R2 manquant (R2_BUCKET ou R2_BUCKET_NAME)");
  }

  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      ContentType: params.contentType,
      Body: params.body,
    }),
  );

  return {
    key: params.key,
    fileUrl: publicFileUrl(params.key),
  };
}

export async function createPresignedUpload(params: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error("Bucket R2 manquant (R2_BUCKET ou R2_BUCKET_NAME)");
  }

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresIn ?? 600,
    // Uniquement Content-Type : évite les checksums AWS qui cassent le PUT navigateur → R2
    signableHeaders: new Set(["content-type"]),
    unhoistableHeaders: new Set([
      "x-amz-checksum-crc32",
      "x-amz-checksum-crc32c",
      "x-amz-checksum-sha1",
      "x-amz-checksum-sha256",
      "x-amz-sdk-checksum-algorithm",
    ]),
  });

  return {
    uploadUrl,
    fileUrl: publicFileUrl(params.key),
    key: params.key,
  };
}
