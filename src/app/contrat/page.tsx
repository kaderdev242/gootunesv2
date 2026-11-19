import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/LegalShell";
import { ContractDocument } from "@/components/contracts/ContractDocument";
import { buildContract } from "@/lib/contracts/template";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contrat artistes et labels",
  description:
    "Le contrat de distribution numérique Gootunes pour les artistes et les labels : droits, licence, rémunération, abonnement et résiliation.",
  alternates: { canonical: siteUrl("/contrat") },
};

type Props = { searchParams: Promise<{ type?: string }> };

export default async function ContratPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const role = type === "label" ? "label" : "artist";
  const contract = buildContract(role, null);

  const tab = (value: "artist" | "label", label: string) => (
    <Link
      href={value === "label" ? "/contrat?type=label" : "/contrat"}
      scroll={false}
      aria-current={role === value ? "page" : undefined}
      className={`inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium transition-colors ${
        role === value ? "bg-white text-black" : "bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <LegalShell title="Contrat artistes et labels" updated="19 novembre 2026">
      <section className="space-y-3">
        <p>
          Chaque artiste et chaque label signe ce contrat électroniquement à la fin de son inscription. Il
          précise que tu gardes tous tes droits, ce que Gootunes peut faire de tes morceaux, comment tu es
          payé et comment y mettre fin.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex gap-2">
            {tab("artist", "Artiste")}
            {tab("label", "Label")}
          </div>
          <a
            href={`/api/contrats/modele?role=${role}`}
            download
            className="inline-flex h-10 items-center rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90"
          >
            Télécharger le PDF
          </a>
        </div>
      </section>

      <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-5 sm:p-8">
        <ContractDocument contract={contract} />
      </div>
    </LegalShell>
  );
}
