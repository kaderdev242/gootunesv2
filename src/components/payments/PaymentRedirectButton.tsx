/**
 * Lien de paiement externe renvoyé par Mbiyo (`redirect_url`, ex. Wave).
 *
 * Le `window.open` lancé après la réponse du serveur est bloqué par la plupart
 * des navigateurs mobiles (pas de geste utilisateur) : ce bouton est le moyen
 * fiable d'ouvrir la page de paiement.
 */
export function PaymentRedirectButton({
  url,
  network,
}: {
  url: string;
  network?: string | null;
}) {
  const label = network === "wave" ? "Wave" : "la page de paiement";
  return (
    <div className="rounded-xl border border-sky-400/25 bg-sky-400/10 px-3 py-3">
      <p className="text-xs text-sky-100/80">
        Termine le paiement sur {label}, puis reviens ici : la validation se
        fait automatiquement.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 flex h-10 items-center justify-center rounded-full bg-sky-400 text-sm font-semibold text-black hover:bg-sky-300"
      >
        {network === "wave" ? "Payer avec Wave" : "Ouvrir la page de paiement"}
      </a>
    </div>
  );
}
