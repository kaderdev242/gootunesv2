# Baseline perf / coûts — avant PR2

Mesures du **2026-10-18** (avant optimisations cache/pagination/images).

## Temps de réponse HTTP

### Local (`npm run dev`, froid → chaud)

| Route | TTFB (échantillon) |
|---|---|
| `/` | ~1,09–1,64 s |
| `/discover/catalogue` | ~0,41–0,89 s |
| `/discover/albums` | ~0,36–0,62 s |

### Production

| URL | TTFB | Total | Taille HTML |
|---|---|---|---|
| `https://www.gootunes.app/` | **3,10 s** | 3,27 s | ~149 Ko |
| `https://www.gootunes.app/discover/catalogue` | **1,53 s** | 1,64 s | ~83 Ko |
| `https://www.gootunes.com/` | **1,97 s** | 2,40 s | ~149 Ko |
| `https://www.gootunes.com/discover/catalogue` | **1,15 s** | 1,50 s | ~83 Ko |

Cibles post-PR2 : home TTFB prod **&lt; 1,0 s** (HTML), catalogue **&lt; 0,6 s**.

### Après PR2 (local, 2026-10-18)

| Route | TTFB chaud |
|---|---|
| `/` | ~1,03 s (shell toujours `force-dynamic`) |
| `/discover/catalogue` | **~0,10 s** (cache 60s + pagination SQL) |

## Lighthouse

À lancer après deploy PR2 (Chrome DevTools ou PageSpeed Insights) sur :
- `https://www.gootunes.com/`
- 1 page release publique

Objectifs brief : LCP &lt; 2,5 s, INP &lt; 200 ms, CLS &lt; 0,1.

## Coûts (estimation postes)

| Poste | Rôle | Leviers |
|---|---|---|
| **1. Cloudflare R2 + Worker stream** | Bande passante audio | Cache CDN, tokens courts, preview bytes |
| **2. Supabase** | Auth + Postgres + egress | Indexes, pagination, moins de `force-dynamic` full-fetch |
| **3. Vercel** | SSR / fonctions | Cache données catalogue, moins de compute |

## Causes identifiées

1. Layout `(app)` en `force-dynamic` → tout le shell non cacheable
2. Catalogue : fetch large puis filtre/slice mémoire
3. `AppImage` force `unoptimized` sur tout `https://` → pas d’AVIF/WebP Next
4. Pas d’index composé `(status, is_hidden, created_at)`
