export interface Env {
  AUDIO_BUCKET: R2Bucket;
  /** Secret HMAC dédié upload — jamais STREAM_SECRET. */
  UPLOAD_SECRET: string;
  /** Origines autorisées, séparées par virgule. */
  ALLOWED_ORIGIN?: string;
}

interface UploadTokenPayload {
  uid: string;
  key: string;
  maxBytes: number;
  contentType: string;
  exp: number;
}

function allowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGIN || "https://www.gootunes.com")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

/** CORS strict : origine absente ou hors liste → null (pas de header ACAO). */
function resolveCorsOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  return allowedOrigins(env).includes(origin) ? origin : null;
}

function corsHeaders(corsOrigin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * Worker écriture seule — upload audio vers R2.
 * Stream request.body → R2 (jamais arrayBuffer). Content-Length obligatoire.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsOrigin = resolveCorsOrigin(request, env);

    if (request.method === "OPTIONS") {
      if (!corsOrigin) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, {
        status: 204,
        headers: corsHeaders(corsOrigin),
      });
    }

    if (request.method !== "PUT") {
      return jsonError(405, "Method not allowed", corsOrigin);
    }

    if (!corsOrigin) {
      return jsonError(403, "Origin non autorisée", null);
    }

    const url = new URL(request.url);
    const tokenParam = url.searchParams.get("token");
    if (!tokenParam) {
      return jsonError(401, "Token manquant", corsOrigin);
    }

    if (!env.UPLOAD_SECRET?.trim()) {
      return jsonError(500, "Configuration upload incomplete", corsOrigin);
    }

    const payload = await verifyUploadToken(tokenParam, env.UPLOAD_SECRET);
    if (!payload) {
      return jsonError(403, "Token invalide ou expiré", corsOrigin);
    }

    if (Date.now() / 1000 > payload.exp) {
      return jsonError(403, "Token expiré", corsOrigin);
    }

    // Clé imposée par le serveur : préfixe utilisateur obligatoire
    const expectedPrefix = `audios/${payload.uid}/`;
    if (!payload.key.startsWith(expectedPrefix) || payload.key.includes("..")) {
      return jsonError(403, "Clé non autorisée", corsOrigin);
    }

    const contentType = (request.headers.get("Content-Type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    const expected = payload.contentType.toLowerCase();
    if (contentType !== expected) {
      return jsonError(400, "Content-Type invalide", corsOrigin);
    }

    // R2 n’accepte un ReadableStream que si la taille est connue.
    const lengthHeader = request.headers.get("Content-Length");
    if (!lengthHeader) {
      return jsonError(411, "Content-Length requis", corsOrigin);
    }
    const contentLength = Number(lengthHeader);
    if (
      !Number.isFinite(contentLength) ||
      contentLength <= 0 ||
      contentLength > payload.maxBytes
    ) {
      return jsonError(400, "Taille de fichier invalide", corsOrigin);
    }

    if (!request.body) {
      return jsonError(400, "Corps manquant", corsOrigin);
    }

    // Stream direct — pas de buffer en mémoire (plafond Worker 128 Mo).
    const result = await env.AUDIO_BUCKET.put(payload.key, request.body, {
      httpMetadata: { contentType: expected },
      // Refuse d’écraser une clé déjà présente
      onlyIf: { etagDoesNotMatch: "*" },
    });

    if (result === null) {
      return jsonError(409, "Fichier déjà présent", corsOrigin);
    }

    return new Response(
      JSON.stringify({ ok: true, key: payload.key, size: contentLength }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(corsOrigin),
        },
      },
    );
  },
};

function jsonError(
  status: number,
  error: string,
  corsOrigin: string | null,
): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (corsOrigin) {
    headers["Access-Control-Allow-Origin"] = corsOrigin;
    headers.Vary = "Origin";
  }
  return new Response(JSON.stringify({ error }), { status, headers });
}

async function verifyUploadToken(
  token: string,
  secret: string,
): Promise<UploadTokenPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, signatureHex] = parts;
    const expectedSig = await hmacSha256(secret, payloadB64);
    if (!timingSafeEqual(signatureHex, expectedSig)) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64)) as UploadTokenPayload;
    if (
      !payload.uid ||
      !payload.key ||
      typeof payload.maxBytes !== "number" ||
      typeof payload.exp !== "number" ||
      !payload.contentType
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(data),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
