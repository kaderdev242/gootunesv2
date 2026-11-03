# Hotfix sécurité 48 h — checklist déploiement

## Forensique (2026-10-18)

| Constat | Volume | Analyse |
|---|---|---|
| `purchases` demo completed (`mode=dev_bypass`) | **10** | Tous le **2026-08-04** — tests manuels, pas `demo_no_mbiyo_key` |
| `purchases` mbiyo completed sans `provider_transaction_id` | **2** | **2026-08-02**, `order_id` null, meta `{}` — données legacy / avant colonnes Mbiyo |
| `library_items` sans purchase mbiyo/apple completed | **10** | Aligné avec les 10 achats demo |
| Abos artiste/label demo | **0** ordre demo | Démo abo écrit directement sur `profiles` (pas d’order) |
| `system_logs` webhook | **0** | Table vide ou pas encore alimentée |

**Conclusion :** pas de preuve d’exploitation massive du webhook ouvert ni de `demo_no_mbiyo_key` en prod. Les 10 gratuits sont des **dev_bypass** datés août. Les 2 mbiyo sans tx sont anciens (début août).

## Correctifs code (ce hotfix)

1. Webhook Mbiyo : sans `MBIYO_WEBHOOK_SECRET` en **production** → **401**
2. Achats / abos artiste & label / retraits : sans `MBIYO_API_KEY` en **production** → erreur (plus de démo gratuite)
3. Upgrade Next.js → **16.4.2** (CVE RCE)

## Variables d’environnement prod (à vérifier AVANT deploy)

| Variable | Requis | Notes |
|---|---|---|
| `MBIYO_API_KEY` | Oui | Sinon tous les paiements bloqués |
| `MBIYO_WEBHOOK_SECRET` | Oui | Sinon tous les webhooks rejetés |
| `NEXT_PUBLIC_SITE_URL` | Oui | `https://www.gootunes.com` (callbacks webhook) |
| `PURCHASE_DEV_BYPASS` | Absente / `0` | Interdit en prod |
| `STREAM_SECRET` | Recommandé | Distinct de `SUPABASE_SERVICE_ROLE_KEY` |

Dashboard Mbiyo : URL webhook = `https://www.gootunes.com/api/webhooks/mbiyo`

## Tests sandbox (après deploy)

1. Payin test réel (petit montant) → webhook `cashin` **200** + purchase `completed`
2. `curl` POST webhook **sans** header Signature → **401**
3. Confirmer `PURCHASE_DEV_BYPASS` absent sur Vercel Production
4. Smoke : home, achat page, abo artiste page chargent sans 500

## Après ce hotfix

Enchaîner **PR1** (rate limit Upstash, Zod, RLS live, Dependabot, mobile secure storage, etc.).
