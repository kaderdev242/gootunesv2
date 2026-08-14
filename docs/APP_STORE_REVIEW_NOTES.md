# App Store Review Notes — GooTunes iOS

Copy into App Store Connect → App Review Information → Notes.

---

## English (for Apple Review)

GooTunes iOS is a **reader app** under guideline **3.1.3(a)**.

- The iOS app **only displays and plays music the user already owns** (library synced from the same account).
- There is **no catalog of unpaid music**, no 20-second storefront preview, **no prices**, and **no purchase buttons or links** in the iOS app.
- Music is purchased on the **website** (Mobile Money), not in the iOS app. After purchase, the user signs in on iOS and finds the content in **Bibliothèque / Ma musique**.
- Navigation on iOS: Bibliothèque, Recherche (owned content only), Playlists, Settings.
- Android and the website handle payments separately; iOS does not sell digital content.

**Demo account:** sign in with the credentials provided in App Review Information. The account already has music in the library so reviewers can play full tracks.

**Support URL:** https://www.gootunes.app/contact

---

## Réponse Resolution Center (FR / EN)

We have updated the iOS app to a library-only reader experience (guideline 3.1.3(a)): users only see and play music they already own. There are no in-app purchase CTAs, prices, or unpaid catalog previews. Purchases occur on the website; the iOS app is a player for owned content. We also fixed the Support URL: https://www.gootunes.app/contact

---

## Checklist avant resoumission

1. Déployer le web (`/contact` live).
2. Build IPA avec le code reader library-only.
3. Compte démo App Review **avec** titres/albums déjà dans `library_items`.
4. Coller les notes ci-dessus.
5. Vérifier captures / description App Store : pas « achetez dans l’app ».
