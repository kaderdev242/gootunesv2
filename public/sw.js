/**
 * Service Worker Gootunes — installable PWA, données toujours fraîches.
 *
 * Stratégie :
 * - HTML / RSC / API / navigation → NetworkOnly (temps réel, pas de stale)
 * - Assets immutables (_next/static, fonts, images locales) → CacheFirst
 *
 * Évite le piège classique des PWA qui servent du HTML/cache et donnent
 * l’impression que le catalogue ne se met pas à jour.
 */
const STATIC_CACHE = "gootunes-static-v2";

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(["/icons/icon-192.png", "/icons/icon-512.png"]),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("gootunes-") && k !== STATIC_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  const { pathname } = url;
  if (pathname.startsWith("/_next/static/")) return true;
  if (pathname.startsWith("/icons/")) return true;
  if (/\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|avif|svg|ico)$/i.test(pathname)) {
    // Ne pas cacher les images R2 / CDN externes ici — same-origin seulement
    return url.origin === self.location.origin;
  }
  return false;
}

function isDataRequest(request, url) {
  if (request.mode === "navigate") return true;
  if (url.pathname.startsWith("/api/")) return true;
  // Next.js App Router RSC / flight
  if (url.searchParams.has("_rsc")) return true;
  if (request.headers.get("RSC") === "1") return true;
  if (request.headers.get("Next-Router-Prefetch") === "1") return true;
  if (request.headers.get("Next-Router-State-Tree")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Cross-origin (Supabase, R2, Worker…) : laisser le réseau, jamais de cache SW
  if (url.origin !== self.location.origin) return;

  // Données dynamiques → toujours le réseau (temps réel)
  if (isDataRequest(request, url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Assets statiques → cache d’abord, sinon réseau
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          if (fresh.ok) cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return cached || Response.error();
        }
      }),
    );
  }
});
