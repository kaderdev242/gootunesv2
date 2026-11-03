# Demande technique : Sécurisation, optimisation et SEO (Web + Mobile)

**Objet :** Audit et mise en place de la sécurité, des performances et du SEO sur le projet web et mobile

---

## 1. Contexte et objectifs

Salut,

Avant la mise en production / la montée en charge, j'ai besoin que tu prennes en charge trois chantiers prioritaires sur le projet (web + mobile) :

1. **Sécurité** : protéger l'application, les données et les utilisateurs contre les attaques courantes.
2. **Performance et coûts** : rendre l'ensemble plus rapide et consommer moins de ressources (serveur, base de données, bande passante) pour réduire la facture d'infrastructure.
3. **SEO** : poser une base technique solide pour le référencement naturel.

**Ordre de priorité :** Sécurité > Performance / Coûts > SEO.

---

## 2. Sécurité

### 2.1 Authentification et sessions
- [x] Hachage des mots de passe : délégué à **Supabase Auth** (bcrypt) ; aucun secret en clair dans l’app.
- [x] Tokens / sessions : JWT + refresh Supabase SSR (`@supabase/ssr`).
- [x] Cookies : gérés par Supabase SSR (HttpOnly / Secure / SameSite).
- [x] Limitation des tentatives de connexion : rate limit Upstash sur `signIn`/`signUp` (10/5 par min/IP, strict en prod).
- [ ] Vérification email / OTP pour les artistes (web). *(reporté — product)*

### 2.2 Autorisations et accès aux données
- [x] Contrôle d'accès serveur : Server Actions + `getUser()` sur API sensibles (revue PR1, voir `docs/SECURITY_PR1.md`).
- [x] Moindre privilège : rôles fan/artist/label/admin + proxy.
- [x] Protection IDOR : policies RLS + checks owner/buyer (revue documentée).
- [x] **RLS live** : 19/19 tables `public` avec `relrowsecurity=true` (preuve 2026-10-18). `service_role` serveur uniquement.

### 2.3 Protection contre les attaques courantes (OWASP Top 10)
- [x] **Injections** : client Supabase paramétré (pas de SQL concaténé).
- [ ] **XSS / CSP stricte** : CSP présente mais encore `unsafe-inline` + **`unsafe-eval` en prod** (à durcir avec nonces).
- [x] **CSRF** : Server Actions + cookies SameSite Supabase (doc `SECURITY_PR1.md`).
- [x] **Validation des entrées** : Zod sur auth, presign, webhook Mbiyo, payin.
- [x] **Upload** : MIME + taille (presign aligné 5/50 Mo) + magic bytes sur upload direct.
- [x] **SSRF / redirections** : proxy hosts allowlist ; `next` redirect contrôlé.
- [x] **Rate limiting** : Upstash partagé (auth strict, stream, system-log).
- [x] **Paiements fail-closed (hotfix 48h)** : voir `docs/HOTFIX_SECURITY_48H.md`.

### 2.4 Infrastructure et configuration
- [x] HTTPS + **HSTS**.
- [x] En-têtes de sécurité (CSP encore permissive — note ci-dessus).
- [x] CORS Worker audio restreint via `ALLOWED_ORIGIN` (plus de `*`).
- [x] Secrets hors code (`.env*` gitignoré) ; scan historique : pas de `.env` tracké. Rotation manuelle si doute.
- [x] Next.js **16.4.2** + **Dependabot** (`.github/dependabot.yml`).
- [x] Messages d'erreur génériques client (`mapAuthError` / `USER_ERRORS`) ; logs serveur.
- [x] Sauvegardes : procédure PITR / restore documentée dans `docs/SECURITY_PR1.md` (à activer côté Dashboard).
- [x] Monitoring : `system_logs` + Aptabase + alertes Vercel (à brancher budget).

### 2.5 Spécifique mobile
- [x] Tokens dans **flutter_secure_storage** (Keychain/Keystore) via `SecureLocalStorage`.
- [x] HTTPS uniquement (Supabase / API). Certificate pinning : **reporté** (ops mobile).
- [x] Script obfuscation : `mobile/scripts/build_release_obfuscated.sh`.
- [x] Pas de service_role dans l’app (anon key seulement).
- [ ] Détection root / jailbreak : **reporté** (justifié N/A court terme).
- [x] Permissions : limitées (audio, photos IAP).

---

## 3. Optimisation des performances et réduction des coûts

### 3.1 Frontend web
- [x] Baseline mesurée : `docs/BASELINE_PERF.md` (TTFB prod home ~2–3 s ; catalogue ~1,2–1,5 s). Lighthouse PageSpeed à relancer post-deploy.
- [x] Images : `AppImage` optimise R2/Cloudinary (AVIF/WebP) ; lazy via `LazyCover`.
- [x] Code splitting : `FullscreenPlayer` en `next/dynamic`.
- [x] Polices : `next/font` Outfit/Syne + `display: swap`.
- [ ] Rendu : shell `(app)` encore `force-dynamic` (session) ; données catalogue en cache 60s.
- [x] Assets Next/CDN ; Worker audio Cloudflare.
- [x] Compression : gérée par Vercel (Brotli).

### 3.2 Backend et base de données
- [x] Catalogue : pagination `.range()` + filtres SQL (plus de fetch 80 + slice).
- [x] Index Discover : migration `021_discover_indexes.sql` (appliquée en prod).
- [x] Pagination catalogue UI (`?page=`).
- [x] Cache applicatif `unstable_cache` tag `discover-releases` (60s).
- [x] Pooling : Supabase pooler (à confirmer URL `pooler` en prod).
- [ ] Jobs lourds (backfill) : déjà hors request utilisateur via route cron.
- [ ] Debounce search client : partiel.

### 3.3 Mobile
- [ ] Optimisation des rebuilds de widgets (`const`, séparation des widgets, gestion d'état ciblée).
- [ ] Listes virtualisées (`ListView.builder`) et pagination infinie.
- [ ] Images mises en cache et redimensionnées (cache réseau, miniatures côté serveur).
- [ ] Réduction de la taille de l'app (tree shaking, assets compressés, split par ABI).
- [ ] Mode hors-ligne / cache local pour limiter les appels réseau.
- [ ] Optimisation du démarrage à froid et de la consommation batterie / data.

### 3.4 Coûts d'infrastructure
- [ ] Faire un **audit des coûts** actuels (hébergement, BDD, stockage, bande passante, services tiers) et identifier les 3 postes les plus chers.
- [ ] Dimensionner les ressources au besoin réel (éviter le sur-provisionnement).
- [ ] Nettoyer le stockage inutile (fichiers orphelins, anciennes sauvegardes, logs volumineux) et définir des politiques de rétention.
- [ ] Limiter le trafic abusif (rate limiting, protection anti-bots) qui génère des coûts inutiles.
- [ ] Mettre en place des alertes de consommation / budget.

---

## 4. SEO technique

### 4.1 Fondations
- [x] **Balises meta** uniques : home + listes Discover + release/artiste + légales.
- [x] Structure HTML : `lang=fr`, heroes/listes avec `h1` ; inventaire `docs/SEO_PUBLIC_PAGES.md`.
- [x] **URLs propres** : `public_id` + redirect 301 UUID → public_id.
- [x] **Canonical** sur listes / fiches détail.
- [x] `lang="fr"` (pas de hreflang — monolingue).

### 4.2 Indexation
- [x] **`sitemap.ts`** dynamique (static + releases/artistes).
- [x] **`robots.ts`** : disallow api/artist/label/… — **sans** lister `/goo-admin` (noindex + auth).
- [x] `noindex` : goo-admin, artist, label, onboarding, auth, bibliothèque, `/accueil`.
- [x] Page `not-found` Next (HTTP 404).
- [ ] Soumettre sitemap à **Google Search Console** / Bing (action manuelle post-deploy).

### 4.3 Données structurées et partage social
- [x] JSON-LD : `Organization` + `WebSite` (layout) ; `MusicAlbum` / `MusicRecording` ; `MusicGroup`.
- [x] Open Graph / Twitter : défaut logo + fiches release/artiste + listes.
- [x] Favicon / icônes (`/icon-gootunes.png`).

### 4.4 Performance et expérience (facteurs de classement)
- [ ] Core Web Vitals au vert (voir section 3.1).
- [ ] Site 100 % responsive et mobile-first.
- [ ] Contenu important rendu côté serveur (visible sans JavaScript pour les robots).
- [ ] Attribut `alt` descriptif sur toutes les images, noms de fichiers explicites.
- [ ] Maillage interne cohérent, fil d'Ariane, pas de pages orphelines.

### 4.4 bis Mobile (visibilité)
- [ ] Deep links / Universal Links / App Links configurés entre web et app.
- [ ] Optimisation de la fiche store (ASO) : titre, mots-clés, captures d'écran, description.
- [ ] Bannière « Ouvrir dans l'application » sur le web si pertinent.

### 4.5 Suivi
- [ ] Analytics respectueux de la vie privée ou GA4 configuré (événements clés, conversions).
- [ ] Suivi des positions et du trafic organique après mise en ligne.

---

## 5. Livrables attendus

1. **Rapport d'audit initial** (sécurité, performance, SEO) avec les failles / points faibles classés par criticité (Critique, Élevé, Moyen, Faible).
2. **Corrections implémentées** sur des branches / PR séparées par chantier (sécurité, perf, SEO) pour faciliter la revue.
3. **Rapport avant / après** : scores Lighthouse, temps de réponse API, poids des pages, estimation de l'économie de coûts.
4. **Documentation** : ce qui a été fait, les variables d'environnement, les procédures de déploiement, de sauvegarde et de restauration.
5. **Checklist finale validée** : chaque case cochée ou justifiée si non applicable.
