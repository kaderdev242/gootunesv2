# Inventaire pages — indexation SEO

## Publiques (indexables)

| URL | Notes |
|---|---|
| `/` | Home Discover |
| `/discover/catalogue` | Catalogue |
| `/discover/albums` | Albums |
| `/discover/artistes` | Artistes |
| `/discover/hits` | Hits éditoriaux |
| `/discover/tendances` | Tendances |
| `/discover/sorties` | Sorties |
| `/discover/genres` | Genres |
| `/discover/nouveautes` | Nouveautés |
| `/discover/decouvrir` | Explore / recherche |
| `/discover/release/[public_id]` | Fiche single/album |
| `/discover/artiste/[public_id]` | Fiche artiste |
| `/contact` | Contact |
| `/termes` | CGU |
| `/confidentialite` | Confidentialité |

## Publiques mais `noindex` (ou non listées sitemap)

| URL | Motif |
|---|---|
| `/accueil` | Landing legacy |
| `/connexion` | Auth |
| `/inscription` | Auth |
| `/discover/bibliotheque` | Nécessite session |
| `/discover/favoris` | Nécessite session |
| `/discover/playlists*` | Contenu user |
| `/discover/recherche` | Résultats dynamiques |
| `/discover/release/.../acheter` | Tunnel achat |
| `/maintenance` | Ops |
| `/compte-suspendu` | Compte |

## Privées (auth + `noindex` layout — **pas** listées dans `robots.txt`)

| Préfixe | Auth |
|---|---|
| `/goo-admin/*` | Admin |
| `/artist/*` | Créateur |
| `/label/*` | Label |
| `/onboarding` | Créateur |
| `/dashboard` | Redirect legacy |

## API

`/api/*` — `Disallow` dans robots.
