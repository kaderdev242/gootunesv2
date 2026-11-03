# App Store Review Notes — GooTunes iOS

Copy into App Store Connect → App Review Information → Notes.

---

## English (for Apple Review)

GooTunes iOS sells digital music **via Apple In-App Purchase** (guideline **3.1.1**).

- Users can browse the catalog. **There is no 20-second preview.** Playback starts only after the user buys the release with StoreKit.
- The checkout screen shows the **StoreKit localized price** (e.g. $0.99 / €0.99).
- After a successful IAP, the track/album is unlocked in the user’s library and can be played in full.
- **No Mobile Money / external payment** is offered in the iOS app. Android and the website use Mobile Money separately.
- Restore: Settings → **Restaurer les achats**.
- Bundle ID: `com.gootunes.app`

**Consumable IAP products** (create in App Store Connect, price point = US base):

| Product ID | Catalog (FCFA) | US price point |
|---|---|---|
| `gootunes.unlock.t1` | 500 | $0.99 |
| `gootunes.unlock.t2` | 1 000 | $1.99 |
| `gootunes.unlock.t3` | 1 500 | $2.99 |
| `gootunes.unlock.t4` | 2 000 | $3.99 |
| `gootunes.unlock.t5` | 3 000 | $4.99 |
| `gootunes.unlock.t6` | 5 000 | $7.99 |
| `gootunes.unlock.t7` | 8 000 | $12.99 |
| `gootunes.unlock.t8` | 10 000 | $14.99 |

**Demo account:** sign in with the App Review credentials. Use a **Sandbox Apple ID** to complete a test purchase, then play the unlocked track.

**Support URL:** https://www.gootunes.com/contact

---

## Réponse Resolution Center (FR / EN)

We now use Apple In-App Purchase to unlock music on iOS. There is no 20-second preview: users must buy a release first, then it is unlocked in their library. The in-app price is the StoreKit localized price. Mobile Money is not available in the iOS app. Support URL: https://www.gootunes.com/contact

---

## Checklist avant resoumission

1. Créer les 8 SKU consommables dans App Store Connect (price points US ci-dessus).
2. Activer In-App Purchase sur l’App ID `com.gootunes.app`.
3. Appliquer la migration `019_apple_iap.sql` en production.
4. Déployer le web (`POST /api/purchases/apple/verify`).
5. Build IPA `1.0.4+12`.
6. Compte démo + **Sandbox Apple ID**.
7. Coller les notes ci-dessus.
8. Captures / description : achat in-app Apple, pas Mobile Money.
