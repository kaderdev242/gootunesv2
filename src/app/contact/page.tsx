import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal/LegalShell";
import { contactInbox } from "@/lib/email/client";

export const metadata: Metadata = {
  title: "Contact & Support — Gootunes",
  description:
    "Contacter le support Gootunes : aide compte, bibliothèque, achats iOS et signalements.",
};

export default function ContactPage() {
  const support = contactInbox();

  return (
    <LegalShell title="Contact & Support" updated="23 août 2026">
      <LegalSection title="Nous écrire">
        <p>
          Pour toute question sur ton compte, ta bibliothèque, un paiement ou un
          signalement, contacte notre équipe :
        </p>
        <p>
          <a
            href={`mailto:${support}`}
            className="font-semibold text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
          >
            {support}
          </a>
        </p>
        <p>
          Indique ton adresse e-mail de compte Gootunes et une description
          claire du problème. Nous répondons en général sous quelques jours
          ouvrés.
        </p>
      </LegalSection>

      <LegalSection title="Application iOS">
        <p>
          Sur iPhone et iPad, tu parcours le catalogue et tu achètes la musique
          uniquement via les achats intégrés Apple (In-App Purchase). Après
          paiement, le titre est débloqué dans ta bibliothèque.
        </p>
        <p>
          Il n&apos;y a pas d&apos;aperçu 20 secondes : l&apos;écoute complète
          commence après l&apos;achat. Les paiements Mobile Money ne sont pas
          proposés dans l&apos;app iOS.
        </p>
        <p>
          Si un achat n&apos;apparaît pas après réinstallation : Paramètres →{" "}
          <strong className="text-white">Restaurer les achats</strong>.
        </p>
      </LegalSection>

      <LegalSection title="FAQ rapide">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong className="text-white">Bibliothèque vide sur iOS ?</strong>{" "}
            Connecte-toi avec le même compte, puis restaure les achats. Les
            titres apparaissent après un achat In-App Purchase validé.
          </li>
          <li>
            <strong className="text-white">Achat / Mobile Money ?</strong> Sur
            iOS, uniquement Apple In-App Purchase. Mobile Money est réservé au
            site web et à Android.
          </li>
          <li>
            <strong className="text-white">Compte artiste / label ?</strong> La
            publication et le dashboard se font sur le web.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Documents légaux">
        <p>
          <Link
            href="/termes"
            className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
          >
            Conditions d&apos;utilisation
          </Link>
          {" · "}
          <Link
            href="/confidentialite"
            className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
          >
            Politique de confidentialité
          </Link>
        </p>
      </LegalSection>
    </LegalShell>
  );
}
