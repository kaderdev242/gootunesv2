import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection, LegalShell } from "@/components/legal/LegalShell";
import { contactInbox } from "@/lib/email/client";

export const metadata: Metadata = {
  title: "Contact & Support — Gootunes",
  description:
    "Contacter le support Gootunes : aide compte, bibliothèque iOS, achats web et signalements.",
};

export default function ContactPage() {
  const support = contactInbox();

  return (
    <LegalShell title="Contact & Support" updated="4 août 2026">
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
          Sur iPhone et iPad, Gootunes est une application de lecture : elle
          affiche et lit la musique déjà présente dans ta bibliothèque après
          connexion avec le même compte.
        </p>
        <p>
          Les achats de musique se font sur le site web{" "}
          <Link
            href="/"
            className="text-white underline decoration-white/25 underline-offset-4 hover:decoration-white"
          >
            gootunes.app
          </Link>
          . Une fois l&apos;achat effectué, reconnecte-toi dans l&apos;app pour
          retrouver tes titres.
        </p>
      </LegalSection>

      <LegalSection title="FAQ rapide">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong className="text-white">Bibliothèque vide sur iOS ?</strong>{" "}
            Vérifie que tu es connecté avec le compte utilisé sur le web, puis
            tire pour actualiser. Les titres apparaissent après un achat validé
            sur le site.
          </li>
          <li>
            <strong className="text-white">Achat / Mobile Money ?</strong> Les
            paiements fans se gèrent sur le site web (ou Android). L&apos;app
            iOS ne propose pas d&apos;achat in-app.
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
