import { formatFcfa } from "@/lib/format";
import { appUrl } from "./client";
import { emailLayout, escapeHtml, p, strongLine } from "./layout";

const ROLE_LABEL: Record<string, string> = {
  fan: "Fan",
  artist: "Artiste",
  label: "Label",
};

export function welcomeEmail(input: {
  displayName?: string | null;
  role: string;
}) {
  const name = input.displayName?.trim() || "toi";
  const role = ROLE_LABEL[input.role] || input.role;
  const href =
    input.role === "fan"
      ? appUrl("/discover")
      : input.role === "label"
        ? appUrl("/label")
        : appUrl("/artist");

  return {
    subject: "Bienvenue sur Gootunes",
    html: emailLayout({
      preheader: "Ton compte est prêt.",
      title: `Bienvenue, ${name}`,
      bodyHtml: [
        p(`Ton compte ${role} est créé. Tu peux commencer dès maintenant.`),
        p(
          input.role === "fan"
            ? "Explore le catalogue, écoute les aperçus et soutiens les artistes que tu aimes."
            : "Publie ta musique, suis tes stats et encaisse tes ventes Mobile Money.",
        ),
      ].join(""),
      cta: {
        label: input.role === "fan" ? "Découvrir" : "Ouvrir mon espace",
        href,
      },
    }),
    text: `Bienvenue sur Gootunes. Compte ${role} créé. ${href}`,
  };
}

export function releasePublishedEmail(input: {
  title: string;
  type: "single" | "album";
  artistName: string;
  priceFcfa: number;
  releaseId: string;
}) {
  const kind = input.type === "album" ? "album" : "single";
  return {
    subject: `${input.type === "album" ? "Album" : "Single"} publié — ${input.title}`,
    html: emailLayout({
      preheader: `${input.title} est en ligne.`,
      title: "Publication réussie",
      bodyHtml: [
        p(`Ton ${kind} est maintenant disponible sur Gootunes.`),
        strongLine("Titre", input.title),
        strongLine("Artiste", input.artistName),
        strongLine("Prix", formatFcfa(input.priceFcfa)),
      ].join(""),
      cta: {
        label: "Voir la publication",
        href: appUrl(`/discover/release/${input.releaseId}`),
      },
    }),
    text: `${input.title} (${kind}) publié — ${formatFcfa(input.priceFcfa)}`,
  };
}

export function labelArtistCreatedEmail(input: {
  stageName: string;
  country: string;
  labelName?: string | null;
}) {
  const who = input.labelName?.trim() || "ton label";
  return {
    subject: `Artiste ajouté — ${input.stageName}`,
    html: emailLayout({
      preheader: `${input.stageName} a été ajouté au roster.`,
      title: "Nouvel artiste",
      bodyHtml: [
        p(`${who} a ajouté un artiste au roster.`),
        strongLine("Nom de scène", input.stageName),
        strongLine("Pays", input.country),
      ].join(""),
      cta: {
        label: "Voir mes artistes",
        href: appUrl("/label/artistes"),
      },
    }),
    text: `Artiste ${input.stageName} ajouté (${input.country}).`,
  };
}

export function purchaseBuyerEmail(input: {
  buyerName?: string | null;
  title: string;
  artistName: string;
  amountFcfa: number;
  releaseId: string;
}) {
  const name = input.buyerName?.trim() || "toi";
  return {
    subject: `Achat confirmé — ${input.title}`,
    html: emailLayout({
      preheader: "Écoute complète débloquée.",
      title: "Merci pour ton achat",
      bodyHtml: [
        p(`C’est bon, ${name}. L’écoute complète est débloquée.`),
        strongLine("Titre", input.title),
        strongLine("Artiste", input.artistName),
        strongLine("Montant", formatFcfa(input.amountFcfa)),
      ].join(""),
      cta: {
        label: "Écouter maintenant",
        href: appUrl(`/discover/release/${input.releaseId}`),
      },
    }),
    text: `Achat confirmé : ${input.title} — ${formatFcfa(input.amountFcfa)}`,
  };
}

export function purchaseSellerEmail(input: {
  sellerName?: string | null;
  title: string;
  artistName: string;
  buyerName?: string | null;
  amountFcfa: number;
  netFcfa: number;
  releaseId: string;
  dashboardPath?: string;
}) {
  const name = input.sellerName?.trim() || "toi";
  return {
    subject: `Nouvelle vente — ${input.title}`,
    html: emailLayout({
      preheader: "Un fan vient d’acheter ta musique.",
      title: "Nouvelle vente",
      bodyHtml: [
        p(`Bonne nouvelle, ${name}. Une vente vient d’être confirmée.`),
        strongLine("Titre", input.title),
        strongLine("Artiste", input.artistName),
        strongLine("Acheteur", input.buyerName?.trim() || "Fan Gootunes"),
        strongLine("Montant payé", formatFcfa(input.amountFcfa)),
        strongLine("Net crédité", formatFcfa(input.netFcfa)),
      ].join(""),
      cta: {
        label: "Voir mon espace",
        href: appUrl(input.dashboardPath || "/artist"),
      },
    }),
    text: `Vente : ${input.title} — net ${formatFcfa(input.netFcfa)}`,
  };
}

export function contactLeadEmail(input: {
  intent: "call" | "contact";
  name: string;
  email: string;
  company?: string | null;
  message: string;
}) {
  const intentLabel =
    input.intent === "call" ? "Planifier un appel" : "Nous contacter";
  return {
    subject: `[Sponsoring] ${intentLabel} — ${input.name}`,
    html: emailLayout({
      preheader: `Nouveau message sponsoring de ${input.name}`,
      title: intentLabel,
      bodyHtml: [
        p("Nouveau message reçu depuis la landing Gootunes."),
        strongLine("Intention", intentLabel),
        strongLine("Nom", input.name),
        strongLine("Email", input.email),
        input.company?.trim()
          ? strongLine("Entreprise / marque", input.company.trim())
          : "",
        `<p style="margin:16px 0 8px;color:#888888;">Message</p>
         <p style="margin:0;white-space:pre-wrap;color:#111111;">${escapeHtml(input.message)}</p>`,
      ].join(""),
    }),
    text: [
      intentLabel,
      `Nom: ${input.name}`,
      `Email: ${input.email}`,
      input.company ? `Entreprise: ${input.company}` : "",
      "",
      input.message,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function contactAckEmail(input: { name: string }) {
  const who = input.name.trim() || "toi";
  return {
    subject: "Nous avons bien reçu ton message — Gootunes",
    html: emailLayout({
      preheader: "Merci pour ton intérêt.",
      title: "Message reçu",
      bodyHtml: [
        p(`Merci ${who}.`),
        p(
          "Ton message sponsoring est bien arrivé. L’équipe Gootunes te répondra rapidement.",
        ),
      ].join(""),
      cta: { label: "Voir Gootunes", href: appUrl("/") },
    }),
    text: `Merci ${who}. Nous avons bien reçu ton message sponsoring.`,
  };
}

export function accountSuspendedEmail(input: {
  displayName?: string | null;
  supportEmail: string;
}) {
  const who = input.displayName?.trim() || "toi";
  return {
    subject: "Ton compte Gootunes a été suspendu",
    html: emailLayout({
      preheader: "Accès temporairement bloqué.",
      title: "Compte suspendu",
      bodyHtml: [
        p(`Bonjour ${who},`),
        p(
          "Ton compte Gootunes a été suspendu. Tu ne peux plus accéder à ton espace pour le moment.",
        ),
        p(
          `Si tu penses qu’il s’agit d’une erreur, contacte le support : ${input.supportEmail}`,
        ),
      ].join(""),
      cta: {
        label: "Contacter le support",
        href: `mailto:${input.supportEmail}`,
      },
    }),
    text: `Bonjour ${who}. Ton compte Gootunes a été suspendu. Support : ${input.supportEmail}`,
  };
}

export function accountReactivatedEmail(input: {
  displayName?: string | null;
  role: string;
}) {
  const who = input.displayName?.trim() || "toi";
  const href =
    input.role === "fan"
      ? appUrl("/discover")
      : input.role === "label"
        ? appUrl("/label")
        : appUrl("/artist");

  return {
    subject: "Ton compte Gootunes a été réactivé",
    html: emailLayout({
      preheader: "Tu peux te reconnecter.",
      title: "Compte réactivé",
      bodyHtml: [
        p(`Bonjour ${who},`),
        p(
          "Bonne nouvelle : ton compte Gootunes est de nouveau actif. Tu peux te reconnecter et utiliser la plateforme normalement.",
        ),
      ].join(""),
      cta: { label: "Ouvrir Gootunes", href },
    }),
    text: `Bonjour ${who}. Ton compte Gootunes a été réactivé. ${href}`,
  };
}
