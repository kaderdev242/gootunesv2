import { ContractDocument } from "@/components/contracts/ContractDocument";
import { ContractSignForm } from "@/components/contracts/ContractSignForm";
import { contractFromRow, getLatestContract } from "@/lib/contracts/server";
import { CONTRACT_VERSION } from "@/lib/contracts/template";
import type { Profile } from "@/lib/supabase/database.types";

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Brazzaville" });

/** Rubrique « Contrat » des dashboards artiste et label. */
export async function CreatorContractPage({ userId, profile }: { userId: string; profile: Profile }) {
  const role = profile.role === "label" ? "label" : "artist";
  const row = await getLatestContract(userId);
  const outdated = Boolean(row && row.contract_version !== CONTRACT_VERSION);
  const party = {
    displayName: profile.display_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    country: profile.country ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[34px]">Contrat</h1>
      <p className="mt-1 text-sm text-white/50">
        {row
          ? `Signé le ${dateTimeFmt.format(new Date(row.signed_at))} par ${row.signer_name}`
          : "Tu n'as pas encore signé ton contrat Gootunes."}
      </p>

      {row ? (
        <>
          {outdated ? (
            <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
              Une nouvelle version du contrat est disponible. Ton contrat actuel reste valable jusqu&apos;à ce que tu
              signes la nouvelle version, plus bas.
            </div>
          ) : null}

          <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-[#0f0f10] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.signature_png} alt="Ta signature" className="h-14 w-32 shrink-0 rounded-xl bg-white object-contain p-1" />
              <div className="min-w-0 text-[13px] text-white/50">
                <p className="text-[14px] font-medium text-white">Contrat signé</p>
                <p className="truncate">Version {row.contract_version}</p>
                <p className="truncate font-mono text-[11px] text-white/35" title={row.content_hash}>
                  Empreinte {row.content_hash.slice(0, 16)}…
                </p>
              </div>
            </div>
            <a
              href={`/api/contrats/${row.id}`}
              download
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white px-5 text-[14px] font-semibold text-black transition hover:bg-white/90"
            >
              Télécharger le PDF
            </a>
          </section>

          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-[#0f0f10] p-5 sm:p-7">
            <ContractDocument contract={contractFromRow(row)} />
          </div>
        </>
      ) : null}

      {!row || outdated ? (
        <section className="mt-8 rounded-2xl border border-white/[0.06] bg-[#0f0f10] p-5 sm:p-7">
          <h2 className="text-[17px] font-semibold text-white">
            {outdated ? "Signer la nouvelle version" : "Lire et signer ton contrat"}
          </h2>
          <p className="mb-5 mt-1 text-[14px] text-white/50">
            Le contrat est prérempli avec les infos de ton compte. Complète ton nom légal, lis-le, puis signe.
          </p>
          <ContractSignForm role={role} party={party} />
        </section>
      ) : null}
    </div>
  );
}
