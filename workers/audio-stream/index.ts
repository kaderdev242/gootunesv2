export interface Env {
  AUDIO_BUCKET: R2Bucket;
  STREAM_SECRET: string;
  ALLOWED_ORIGIN?: string;
}

interface TokenPayload {
  key: string;
  maxBytes: number;
  exp: number;
}

/**
 * Cloudflare Worker pour le streaming audio R2 ultra-rapide (<50ms).
 * Vérifie un token HMAC SHA-256 signé par le serveur Next.js.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // OPTIONS preflight pour CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Range, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    const tokenParam = url.searchParams.get("token");
    if (!tokenParam) {
      return new Response(JSON.stringify({ error: "Token manquant" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Décodage et vérification du token HMAC
    const verifiedPayload = await verifyToken(tokenParam, env.STREAM_SECRET);
    if (!verifiedPayload) {
      return new Response(JSON.stringify({ error: "Token invalide ou expiré" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { key, maxBytes, exp } = verifiedPayload;
    if (Date.now() / 1000 > exp) {
      return new Response(JSON.stringify({ error: "Token expiré" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Gestion du header Range
    const rangeHeader = request.headers.get("range");
    let start = 0;
    let requestedEnd: number | null = null;
    let isRangeRequest = false;

    if (rangeHeader) {
      const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
      if (match) {
        isRangeRequest = true;
        if (match[1] !== undefined && match[1] !== "") start = Number(match[1]);
        if (match[2] !== undefined && match[2] !== "") {
          requestedEnd = Number(match[2]);
        }
      }
    }

    start = Math.max(0, start);
    if (start >= maxBytes) {
      return new Response(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${maxBytes}`,
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const length =
      requestedEnd != null
        ? Math.max(1, Math.min(requestedEnd, maxBytes - 1) - start + 1)
        : Math.max(1, maxBytes - start);

    // Lecture R2 native dans l'Edge Cloudflare
    const object = await env.AUDIO_BUCKET.get(key, {
      range: { offset: start, length },
    });

    if (!object) {
      return new Response(JSON.stringify({ error: "Fichier introuvable" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // maxBytes est un plafond (aperçu / token), pas la taille du fichier.
    // Annoncer 1 Go fait estimer ~741 min à Chrome au lieu de 4:30.
    const fileSize = object.size;
    const totalSize = Math.min(maxBytes, fileSize);
    if (start >= totalSize) {
      return new Response(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${totalSize}`,
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const end = Math.min(
      requestedEnd ?? totalSize - 1,
      totalSize - 1,
      start + length - 1,
    );
    const contentLength = end - start + 1;

    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.httpMetadata?.contentType || "audio/mpeg",
    );
    headers.set("Content-Disposition", "inline");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "private, no-cache, no-store");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Content-Length", String(contentLength));

    if (isRangeRequest) {
      headers.set("Content-Range", `bytes ${start}-${end}/${totalSize}`);
    }

    const status = isRangeRequest ? 206 : 200;

    if (request.method === "HEAD") {
      return new Response(null, { status, headers });
    }

    return new Response(object.body as ReadableStream, {
      status,
      headers,
    });
  },
};

/**
 * Format du token : base64url(JSON_payload).hex_hmac_signature
 */
async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, signatureHex] = parts;
    const payloadStr = base64UrlDecode(payloadB64);
    const expectedSig = await hmacSha256(secret, payloadB64);

    if (!timingSafeEqual(signatureHex, expectedSig)) {
      return null;
    }

    const payload = JSON.parse(payloadStr) as TokenPayload;
    if (!payload.key || typeof payload.maxBytes !== "number" || typeof payload.exp !== "number") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
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
