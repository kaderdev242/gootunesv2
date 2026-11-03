import type { Metadata } from "next";
import { LegalSection, LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Gootunes",
  description:
    "Conditions générales d'utilisation de Gootunes. Les artistes et labels conservent tous les droits sur leurs morceaux.",
};

export default function TermesPage() {
  return (
    <LegalShell title="Conditions d'utilisation" updated="17 août 2026">
      <LegalSection title="1. Objet">
        <p>
          Gootunes est une marketplace Direct-to-Fan qui met en relation des
          artistes, labels et fans pour la publication, l&apos;écoute en aperçu
          et la vente de musique via Mobile Money.
        </p>
        <p>
          En créant un compte ou en utilisant la plateforme, tu acceptes les
          présentes conditions.
        </p>
      </LegalSection>

      <LegalSection title="2. Propriété intellectuelle — principe fondamental">
        <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white">
          <strong className="font-semibold">
            Gootunes n&apos;a aucun droit de propriété sur les morceaux publiés.
          </strong>{" "}
          Les droits d&apos;auteur, droits voisins et, le cas échéant, les
          droits voisins des producteurs restent entièrement chez l&apos;artiste,
          le label ou le titulaire légitime qui publie le contenu.
        </p>
        <p>
          Gootunes n&apos;acquiert pas la propriété des fichiers audio, des
          covers, des métadonnées ni des catalogues. La plateforme n&apos;est
          pas cessionnaire, éditeur exclusif, ni producteur des œuvres publiées
          par les utilisateurs.
        </p>
      </LegalSection>

      <LegalSection title="3. Licence limitée accordée à Gootunes">
        <p>
          Pour faire fonctionner le service uniquement, le titulaire des droits
          accorde à Gootunes une licence{" "}
          <strong className="text-white">non exclusive</strong>, non
          transférable (sauf prestataires techniques nécessaires), mondiale et
          limitée, uniquement pour :
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>héberger et diffuser les fichiers sur la plateforme ;</li>
          <li>proposer un aperçu d&apos;écoute limité aux fans ;</li>
          <li>
            délivrer l&apos;écoute complète à un acheteur après paiement
            confirmé ;
          </li>
          <li>
            afficher la cover, le titre, le nom d&apos;artiste et les infos de
            fiche catalogue.
          </li>
        </ul>
        <p>
          Cette licence ne confère à Gootunes aucun droit de revente, de
          sous-licence commerciale hors plateforme, ni d&apos;exploitation hors
          du service décrit. Elle prend fin pour un contenu donné lorsque celui-ci
          est retiré ou que le compte est fermé, sous réserve des obligations
          légales de conservation et des achats déjà effectués.
        </p>
      </LegalSection>

      <LegalSection title="4. Responsabilité du publieur">
        <p>
          En publiant un single ou un album, tu déclares disposer de tous les
          droits nécessaires (interprétation, composition, samples, featuring,
          artwork) et que le contenu ne viole pas les droits de tiers.
        </p>
        <p>
          Tu restes seul responsable des litiges liés à tes publications.
          Gootunes peut retirer un contenu signalé ou illicite, sans que cela
          ne transfère aucun droit à la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="5. Achat et écoute">
        <p>
          L&apos;achat d&apos;une publication donne au fan un droit d&apos;écoute
          personnelle sur Gootunes selon les fonctionnalités disponibles. Sauf
          mention contraire, cet achat{" "}
          <strong className="text-white">
            ne transfère pas la propriété de l&apos;œuvre
          </strong>{" "}
          et n&apos;autorise pas la redistribution, la revente ou
          l&apos;exploitation commerciale du fichier.
        </p>
      </LegalSection>

      <LegalSection title="6. Commissions et paiements">
        <p>
          Les ventes Mobile Money (web et Android) créditent l&apos;artiste ou
          le label à hauteur de 80 % du palier catalogue. Les ventes iOS via
          In-App Purchase Apple créditent 70 % du même palier (commission Apple
          d&apos;environ 30 %, sans commission Gootunes supplémentaire).
        </p>
        <p>
          Le solde créateur mélange ces deux sources. Les retraits se font
          uniquement en Mobile Money : Apple verse Gootunes, qui reverse ensuite
          le net iOS sur ce solde.
        </p>
        <p>
          Les paiements sont traités via des prestataires tiers. Gootunes
          n&apos;est pas responsable des refus, retards ou indisponibilités liés
          aux opérateurs ou au prestataire de paiement.
        </p>
      </LegalSection>

      <LegalSection title="7. Comptes">
        <p>
          Tu es responsable de la confidentialité de ton compte. Les comptes
          artiste et label doivent fournir des informations exactes. Un
          abonnement label peut être requis pour certaines fonctionnalités.
        </p>
      </LegalSection>

      <LegalSection title="8. Contenu interdit">
        <p>
          Il est interdit de publier des contenus illicites, contrefaits,
          haineux, ou portant atteinte aux mineurs, ainsi que d&apos;utiliser la
          plateforme pour frauder les paiements ou contourner les protections
          d&apos;écoute.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitation de responsabilité">
        <p>
          Gootunes est fourni « en l&apos;état ». Dans les limites autorisées
          par la loi, la plateforme ne garantit pas une disponibilité
          ininterrompue ni l&apos;absence d&apos;erreurs, et sa responsabilité
          est limitée aux dommages directs prouvés, dans la mesure du possible
          plafonnée aux sommes effectivement perçues par Gootunes au titre du
          service concerné sur les douze derniers mois.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Pour toute question relative à ces conditions ou aux droits sur un
          morceau :{" "}
          <a
            href="mailto:contact@gootunes.com"
            className="text-white underline decoration-white/25 underline-offset-4"
          >
            contact@gootunes.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
