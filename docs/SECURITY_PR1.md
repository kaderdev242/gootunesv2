# PR1 Sécurité — preuves et procédures

## Rate limiting (serverless)

- Avant : `Map` in-memory ([`src/lib/rate-limit.ts`](../src/lib/rate-limit.ts)) — **inefficace** multi-instance Vercel.
- Après : **Upstash Redis** (`@upstash/ratelimit`) si `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
- Auth (`signIn`/`signUp`) : `strict: true` → **refuse** en prod sans Upstash.
- Stream : fallback mémoire + log d’erreur si Upstash absent.

À créer : base Upstash Redis (Vercel Marketplace) et coller les 2 variables en Production.

## Preuve RLS live (2026-10-18)

Requête : `pg_class.relrowsecurity` sur `public`.

| Table | RLS |
|---|---|
| account_deletion_feedback | ON (0 policy = deny-all client) |
| artist_follows | ON |
| artist_plan_orders | ON |
| artists | ON |
| editorial_hits | ON |
| favorites | ON |
| label_plan_orders | ON |
| library_items | ON |
| playlist_tracks | ON |
| playlists | ON |
| profiles | ON |
| purchases | ON |
| releases | ON |
| site_settings | ON |
| system_logs | ON |
| track_plays | ON |
| track_reports | ON |
| tracks | ON |
| withdrawals | ON |

`stream_audit_logs` : **absente** en prod (migration 017 non appliquée) — à pousser séparément si besoin.

## CSRF

- Mutations via **Server Actions** (`"use server"`) + cookies session Supabase SSR.
- Cookies gérés par `@supabase/ssr` (HttpOnly / Secure / SameSite selon défauts Supabase).
- Pas d’API de mutation ouverte sans `getUser()` pour les flux sensibles (upload, payin, admin).

## CORS

- Worker audio : `ALLOWED_ORIGIN` (défaut `https://www.gootunes.com`), plus de `*`.
- Déployer le worker avec `ALLOWED_ORIGIN=https://www.gootunes.com,https://gootunes.com` (+ previews si besoin).

## Secrets Git

- `.env*` gitignoré ; aucun `.env` tracké.
- Mention `SUPABASE_SERVICE_ROLE_KEY` dans l’historique = **nom de variable** dans le code, pas la valeur.
- Action : confirmer dans GitHub → Settings → secret scanning ; rotation si un JWT réel a fuité hors gitignore.

## Sauvegardes / restauration (Supabase)

1. Dashboard → Project Settings → **Database** → activer **PITR** (Pro) ou exports manuels.
2. Test restore : créer un projet staging, restore backup, vérifier `purchases` + `profiles` counts.
3. Fréquence recommandée : PITR continu ; dump logique hebdo si Free/Pro sans PITR.

## Monitoring

- Vercel : alertes erreur 5xx + budget.
- App : `system_logs` + Aptabase.
- Après deploy hotfix : surveiller `401` webhook et erreurs `mbiyo_missing_production`.

## IDOR (revue rapide)

- Purchases : insert `buyer_id = auth.uid()` ; select buyer/seller.
- Stream : `getTrackPlaybackAccess` avant lecture.
- Upload : clé préfixée `{user.id}/`.
- Admin backfill : `CRON_SECRET` uniquement (plus de fallback service_role).
- Dashboards artist/label : filtrés par `owner_id` / rôle dans actions.

## Env à ajouter (prod)

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
STREAM_SECRET=   # obligatoire, distinct de service_role — lecture Worker stream
UPLOAD_SECRET=   # obligatoire, distinct de STREAM_SECRET — écriture Worker upload
# NEXT_PUBLIC_UPLOAD_WORKER_URL=https://gootunes-audio-upload.gootunes.workers.dev
CRON_SECRET=
```
