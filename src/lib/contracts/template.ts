/**
 * Modèle du contrat créateur (artiste ou label).
 * Source unique : la page web, le PDF et l'empreinte d'intégrité sont générés
 * à partir de cette structure. Toute modification de fond = nouvelle version
 * (CONTRACT_VERSION), que les créateurs devront signer à nouveau.
 */
import {
  ARTIST_PLAN,
  COMMISSION_RATE,
  getCountryLabel,
  LABEL_PLANS,
  MIN_RELEASE_PRICE_FCFA,
} from "@/lib/constants";

export const CONTRACT_VERSION = "2026-11-19";
export const CONTRACT_VERSION_LABEL = "Version du 19 novembre 2026";

/**
 * Identité de l'éditeur de Gootunes. Les champs vides ne sont pas affichés :
 * à compléter (raison sociale, immatriculation, adresse) avant mise en ligne.
 */
export const PLATFORM_IDENTITY = {
  name: "Gootunes",
  legalName: "",
  registration: "",
  address: "",
  email: "contact@gootunes.com",
  website: "www.gootunes.com",
} as const;

export type ContractRole = "artist" | "label";

export type ContractParty = {
  /** Nom et prénom légaux du signataire (ou représentant légal du label). */
  legalName: string;
  /** Nom de scène (artiste) ou nom commercial (label). */
  displayName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
};

export type ContractArticle = { title: string; paragraphs: string[] };

export type Contract = {
  version: string;
  versionLabel: string;
  role: ContractRole;
  title: string;
  platform: { title: string; lines: string[] };
  creator: { title: string; lines: string[] };
  articles: ContractArticle[];
};

const BLANK = "……………………………";

function fcfa(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount).replace(/ /g, " ")} FCFA`;
}

function platformLines(): string[] {
  const p = PLATFORM_IDENTITY;
  return [
    p.legalName ? `${p.legalName}, éditrice de la plateforme ${p.name}` : `L'éditeur de la plateforme ${p.name}`,
    ...(p.registration ? [p.registration] : []),
    ...(p.address ? [p.address] : []),
    `Contact : ${p.email} · ${p.website}`,
    "ci-après « Gootunes » ou « la Plateforme »",
  ];
}

function creatorLines(role: ContractRole, party: ContractParty | null): string[] {
  const v = (value: string | undefined) => (value && value.trim() ? value.trim() : BLANK);
  const country = party?.country ? getCountryLabel(party.country) : BLANK;
  const place = party?.city?.trim() ? `${party.city.trim()}, ${country}` : country;
  return [
    `${role === "label" ? "Représenté par" : "Nom et prénom"} : ${v(party?.legalName)}`,
    `${role === "label" ? "Nom du label" : "Nom de scène"} : ${v(party?.displayName)}`,
    `E-mail : ${v(party?.email)}`,
    `Téléphone : ${v(party?.phone)}`,
    `Pays : ${place}`,
    `ci-après « ${role === "label" ? "le Label" : "l'Artiste"} »`,
  ];
}

/** Construit le contrat, prérempli si `party` est fourni, sinon modèle vierge. */
export function buildContract(role: ContractRole, party: ContractParty | null): Contract {
  const isLabel = role === "label";
  const who = isLabel ? "le Label" : "l'Artiste";
  const Who = isLabel ? "Le Label" : "L'Artiste";
  const share = Math.round((1 - COMMISSION_RATE) * 100);
  const commission = Math.round(COMMISSION_RATE * 100);

  const articles: ContractArticle[] = [
    {
      title: "Objet",
      paragraphs: [
        `Le présent contrat fixe les conditions dans lesquelles ${who} publie, met en vente et fait écouter ${
          isLabel ? "les œuvres musicales des artistes qu'il représente" : "ses œuvres musicales"
        } sur Gootunes, marketplace Direct-to-Fan accessible sur le web et sur les applications mobiles.`,
        "Il complète les Conditions d'utilisation de Gootunes, qui s'appliquent également. En cas de contradiction, le présent contrat prévaut.",
      ],
    },
    {
      title: "Propriété des droits",
      paragraphs: [
        `${Who} conserve l'intégralité de ses droits sur les œuvres publiées : droits d'auteur, droits voisins, droits sur les enregistrements, pochettes et métadonnées.`,
        "Gootunes n'acquiert aucun droit de propriété sur les œuvres. Le présent contrat n'emporte aucune cession de droits.",
      ],
    },
    {
      title: "Licence accordée à Gootunes",
      paragraphs: [
        `Pour la seule exécution du service, ${who} accorde à Gootunes une licence non exclusive, mondiale, non transférable et limitée à la durée de publication, afin d'héberger les fichiers, de proposer des extraits d'écoute, de délivrer l'écoute complète aux acheteurs et d'afficher les visuels et informations des œuvres.`,
        `${Who} reste libre de distribuer ses œuvres sur tout autre service, sans exclusivité.`,
        "La licence prend fin pour une œuvre dès son retrait, sous réserve des achats déjà réalisés : les fans qui ont acheté une œuvre conservent leur accès.",
      ],
    },
    {
      title: `Garanties ${isLabel ? "du Label" : "de l'Artiste"}`,
      paragraphs: [
        `${Who} garantit détenir tous les droits et autorisations nécessaires à la publication (interprétation, composition, samples, featurings, visuels) et que les œuvres ne portent pas atteinte aux droits de tiers.`,
        ...(isLabel
          ? [
              "Le Label garantit en outre disposer d'un mandat ou d'un contrat valable de chacun des artistes qu'il publie sur Gootunes, et répond seul des relations financières avec ces artistes.",
            ]
          : []),
        `${Who} garantit Gootunes contre toute réclamation de tiers liée aux œuvres publiées.`,
      ],
    },
    {
      title: "Publication et prix",
      paragraphs: [
        `${Who} fixe librement le prix de chaque single ou album, dans la limite d'un prix minimum de ${fcfa(MIN_RELEASE_PRICE_FCFA)} imposé par les opérateurs de paiement.`,
        "Gootunes peut refuser, suspendre ou retirer une publication manifestement illicite, signalée pour atteinte aux droits d'un tiers ou contraire aux Conditions d'utilisation, et en informe le créateur.",
      ],
    },
    {
      title: "Rémunération",
      paragraphs: [
        `Pour chaque vente payée en Mobile Money (web et Android), ${who} perçoit ${share} % du prix de vente ; Gootunes conserve une commission de ${commission} %.`,
        `Pour chaque vente réalisée sur iOS par achat intégré Apple, ${who} perçoit 70 % du palier de prix, Apple prélevant environ 30 %, sans commission Gootunes supplémentaire.`,
        `Les sommes sont créditées sur le solde ${isLabel ? "du Label" : "de l'Artiste"}, consultable à tout moment dans son espace. Les retraits se font en Mobile Money vers le numéro choisi, au-delà du montant minimum affiché dans l'espace, et sont traités dans les meilleurs délais.`,
      ],
    },
    {
      title: "Abonnement",
      paragraphs: isLabel
        ? [
            `La publication requiert un abonnement Label annuel : ${LABEL_PLANS.starter.name} à ${fcfa(LABEL_PLANS.starter.price)} par an (jusqu'à ${LABEL_PLANS.starter.maxArtists} artistes) ou ${LABEL_PLANS.unlimited.name} à ${fcfa(LABEL_PLANS.unlimited.price)} par an (artistes illimités).`,
            "L'abonnement n'est pas renouvelé automatiquement. À son expiration, les œuvres déjà publiées restent en vente.",
          ]
        : [
            `La publication requiert l'abonnement ${ARTIST_PLAN.name} au prix de ${fcfa(ARTIST_PLAN.price)} par an, donnant droit à des publications illimitées pendant un an.`,
            "L'abonnement n'est pas renouvelé automatiquement. À son expiration, les œuvres déjà publiées restent en vente.",
          ],
    },
    {
      title: "Protection des contenus",
      paragraphs: [
        "Gootunes met en œuvre des mesures techniques pour limiter la copie des fichiers : écoute en streaming protégé, extraits limités pour les non-acheteurs, contrôle d'accès des achats.",
        "Toute fraude aux paiements, manipulation des écoutes ou tentative de contournement de ces protections peut entraîner la suspension du compte et la retenue des sommes concernées.",
      ],
    },
    {
      title: "Durée et résiliation",
      paragraphs: [
        "Le contrat prend effet à sa signature électronique et est conclu pour une durée indéterminée.",
        `${Who} peut y mettre fin à tout moment en retirant ses œuvres ou en fermant son compte ; le solde disponible reste retirable. Gootunes peut y mettre fin en cas de manquement grave, après notification.`,
      ],
    },
    {
      title: "Données personnelles",
      paragraphs: [
        "Les informations du présent contrat sont traitées pour son exécution, la gestion des paiements et le respect des obligations légales, conformément à la Politique de confidentialité de Gootunes.",
        "Le contrat signé et ses preuves de signature sont conservés pendant toute la durée de la relation, puis pendant la durée de prescription légale.",
      ],
    },
    {
      title: "Responsabilité",
      paragraphs: [
        "Gootunes s'engage à fournir le service avec diligence mais ne garantit pas une disponibilité ininterrompue. Elle n'est pas responsable des refus, retards ou indisponibilités des opérateurs de paiement.",
        "La responsabilité de Gootunes est limitée aux dommages directs prouvés, dans la limite des commissions perçues au titre du présent contrat au cours des douze derniers mois.",
      ],
    },
    {
      title: "Évolution du contrat",
      paragraphs: [
        "Gootunes peut faire évoluer le présent contrat. Toute nouvelle version est notifiée au créateur et soumise à sa signature ; à défaut d'acceptation, il peut mettre fin au contrat dans les conditions prévues ci-dessus.",
      ],
    },
    {
      title: "Droit applicable et litiges",
      paragraphs: [
        "Le contrat est soumis au droit applicable au lieu d'établissement de l'éditeur de Gootunes, dans le respect des actes uniformes OHADA.",
        `Les parties recherchent d'abord une solution amiable, en écrivant à ${PLATFORM_IDENTITY.email}. À défaut d'accord dans un délai de trente jours, le litige est porté devant les juridictions compétentes.`,
      ],
    },
    {
      title: "Signature électronique",
      paragraphs: [
        `${Who} signe le présent contrat électroniquement, en le lisant intégralement, en cochant la case d'acceptation et en apposant sa signature manuscrite à l'écran.`,
        "La signature est horodatée et accompagnée de l'adresse IP, de l'appareil utilisé et d'une empreinte numérique du texte signé (SHA-256), qui permettent de prouver son intégrité. Les parties reconnaissent à cette signature la même valeur qu'une signature manuscrite.",
      ],
    },
  ];

  return {
    version: CONTRACT_VERSION,
    versionLabel: CONTRACT_VERSION_LABEL,
    role,
    title: isLabel ? "Contrat de distribution numérique — Label" : "Contrat de distribution numérique — Artiste",
    platform: { title: "Entre", lines: platformLines() },
    creator: { title: "Et", lines: creatorLines(role, party) },
    articles,
  };
}

/** Texte canonique servant à l'empreinte SHA-256 du contrat signé. */
export function contractCanonicalText(contract: Contract): string {
  return [
    contract.title,
    contract.versionLabel,
    ...contract.platform.lines,
    ...contract.creator.lines,
    ...contract.articles.flatMap((a, i) => [`Article ${i + 1} — ${a.title}`, ...a.paragraphs]),
  ].join("\n");
}
