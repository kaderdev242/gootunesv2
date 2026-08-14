const ALPHABET =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Génère un id public court (défaut 8 car., sans caractères ambigus). */
export function generatePublicId(length = 8) {
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

export function isUuid(value: string) {
  return UUID_RE.test(value.trim());
}

export function artistPath(publicId: string) {
  return `/discover/artiste/${publicId}`;
}

export function releasePath(publicId: string, suffix = "") {
  const base = `/discover/release/${publicId}`;
  if (!suffix) return base;
  return `${base}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}
