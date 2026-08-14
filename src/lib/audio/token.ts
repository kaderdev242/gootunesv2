import crypto from "crypto";

function getStreamSecret(): string {
  const secret =
    process.env.STREAM_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error(
      "[FATAL] STREAM_SECRET manquant — configurez la variable d'environnement STREAM_SECRET",
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

/**
 * Génère un token HMAC SHA-256 valide pour le Worker Cloudflare Audio.
 * @param key Clé R2 du fichier
 * @param maxBytes Limite octet maximale (20s pour aperçu, total pour full)
 * @param expiresInSec Durée de validité du token en secondes (ex: 600s = 10 min)
 */
export function generateStreamToken(
  key: string,
  maxBytes: number,
  expiresInSec = 600,
): string {
  const secret = getStreamSecret();
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const payload: TokenPayload = { key, maxBytes, exp };

  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payloadB64);
  const signatureHex = hmac.digest("hex");

  return `${payloadB64}.${signatureHex}`;
}

export function getWorkerBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_STREAM_WORKER_URL ||
    process.env.STREAM_WORKER_URL ||
    "https://gootunes-audio-stream.studioempire.workers.dev" // Ou stream.gootunes.app
  );
}
