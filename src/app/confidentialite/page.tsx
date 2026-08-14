import type { Metadata } from "next";
import { LegalSection, LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Gootunes",
  description:
    "Comment Gootunes collecte et utilise vos données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <LegalShell title="Politique de confidentialité" updated="2 août 2026">
      <LegalSection title="1. Qui est responsable">
        <p>
          Gootunes traite les données nécessaires au fonctionnement de la
          marketplace (comptes, publications, achats, retraits).
        </p>
      </LegalSection>

      <LegalSection title="2. Données collectées">
        <p>Selon ton usage, nous pouvons traiter :</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>identité de compte : email, pseudo / nom de scène, pays, téléphone ;</li>
          <li>contenu publié : audio, covers, métadonnées catalogue ;</li>
          <li>
            données de transaction : montants, opérateur Mobile Money, références
            de paiement ;
          </li>
          <li>données d&apos;usage : lectures, bibliothèque, playlists.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalités">
        <p>Ces données servent à :</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>créer et sécuriser ton compte ;</li>
          <li>publier et diffuser les fiches catalogue ;</li>
          <li>traiter les paiements et retraits ;</li>
          <li>envoyer des emails transactionnels (compte, vente, publication) ;</li>
          <li>améliorer le service et prévenir la fraude.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Partage">
        <p>
          Nous partageons uniquement ce qui est nécessaire avec des
          prestataires (hébergement, stockage fichiers, paiement Mobile Money,
          emails). Nous ne vendons pas tes données personnelles.
        </p>
        <p>
          Les fichiers musicaux restent sous le contrôle du titulaire des
          droits ; Gootunes n&apos;en devient pas propriétaire.
        </p>
      </LegalSection>

      <LegalSection title="5. Conservation">
        <p>
          Les données sont conservées pendant la durée du compte et les délais
          légaux ou comptables applicables aux transactions.
        </p>
      </LegalSection>

      <LegalSection title="6. Tes droits">
        <p>
          Selon la réglementation applicable, tu peux demander l&apos;accès, la
          rectification ou la suppression de certaines données, sous réserve des
          obligations légales. Contact :{" "}
          <a
            href="mailto:contact@gootunes.com"
            className="text-white underline decoration-white/25 underline-offset-4"
          >
            contact@gootunes.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Sécurité">
        <p>
          Nous mettons en œuvre des mesures raisonnables pour protéger les
          comptes et les flux de paiement. Aucun système n&apos;étant infaillible,
          tu dois aussi protéger ton mot de passe.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
