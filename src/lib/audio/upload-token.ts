import crypto from "crypto";

function getUploadSecret(): string {
  const secret = process.env.UPLOAD_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "[FATAL] UPLOAD_SECRET manquant — secret dédié upload, distinct de STREAM_SECRET",
    );
  }
  if (
    process.env.STREAM_SECRET?.trim() &&
    secret === process.env.STREAM_SECRET.trim()
  ) {
    throw new Error(
      "[FATAL] UPLOAD_SECRET ne doit pas être identique à STREAM_SECRET",
    );
  }
  return secret;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export type UploadTokenPayload = {
  uid: string;
  key: string;
  maxBytes: number;
  contentType: string;
  exp: number;
};

/**
 * Token HMAC pour PUT Worker upload (secret dédié UPLOAD_SECRET).
 */
export function generateUploadToken(params: {
  userId: string;
  key: string;
  maxBytes: number;
  contentType: string;
  expiresInSec?: number;
}): string {
  const secret = getUploadSecret();
  const payload: UploadTokenPayload = {
    uid: params.userId,
    key: params.key,
    maxBytes: params.maxBytes,
    contentType: params.contentType,
    exp: Math.floor(Date.now() / 1000) + (params.expiresInSec ?? 600),
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signatureHex = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("hex");
  return `${payloadB64}.${signatureHex}`;
}

export function getUploadWorkerBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_UPLOAD_WORKER_URL ||
    process.env.UPLOAD_WORKER_URL ||
    "https://gootunes-audio-upload.gootunes.workers.dev"
  );
}
