import crypto from "crypto";

function getStreamSecret(): string {
  const secret = process.env.STREAM_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "[FATAL] STREAM_SECRET manquant — configurez STREAM_SECRET (ne pas réutiliser la service_role)",
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

export type TokenPayload = {
  key: string;
  maxBytes: number;
  exp: number;
};

function signPayload(payload: TokenPayload): string {
  const secret = getStreamSecret();
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payloadB64);
  const signatureHex = hmac.digest("hex");
  return `${payloadB64}.${signatureHex}`;
}

/**
 * Token HMAC pour lecture audio (Worker GET) — STREAM_SECRET.
 */
export function generateStreamToken(
  key: string,
  maxBytes: number,
  expiresInSec = 600,
): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  return signPayload({ key, maxBytes, exp });
}

export function getWorkerBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_STREAM_WORKER_URL ||
    process.env.STREAM_WORKER_URL ||
    "https://gootunes-audio-stream.gootunes.workers.dev"
  );
}
