import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { ContractDocument } from "@/components/contracts/ContractDocument";
import { ConsoleHeader, Panel, Pill, consoleButtonClass } from "@/components/admin/console/ui";
import { listContractHistory } from "@/lib/contracts/admin-queries";
import { contractFromRow, contractHash, getContractById, partyFromRow } from "@/lib/contracts/server";
import { CONTRACT_VERSION } from "@/lib/contracts/template";

type Props = { params: Promise<{ id: string }> };

const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "medium", timeZone: "UTC" });

export default async function AdminContratDetailPage({ params }: Props) {
  const { id } = await params;
  const row = await getContractById(id);
  if (!row) notFound();

  const contract = contractFromRow(row);
  // Le texte reconstruit doit avoir la même empreinte que le texte signé.
  const intact = contractHash(contract) === row.content_hash;
  const history = row.user_id ? await listContractHistory(row.user_id) : [];
  const current = row.contract_version === CONTRACT_VERSION;

  const facts: [string, React.ReactNode][] = [
    ["Signataire", row.signer_name],
    ["Type de compte", row.role === "label" ? "Label" : "Artiste"],
    ["Signé le", `${dateTimeFmt.format(new Date(row.signed_at))} (UTC)`],
    ["Version", <Pill key="v" tone={current ? "ok" : "warn"}>{current ? `${row.contract_version} · en vigueur` : `${row.contract_version} · ancienne`}</Pill>],
    ["Adresse IP", row.signed_ip ?? "—"],
    ["Appareil", row.signed_user_agent ?? "—"],
    [
      "Empreinte SHA-256",
      <span key="h" className="break-all font-mono text-[12px]">
        {row.content_hash}
      </span>,
    ],
    [
      "Intégrité",
      <Pill key="i" tone={intact ? "ok" : "danger"}>
        {intact ? "Texte identique au texte signé" : "Le modèle a changé depuis la signature"}
      </Pill>,
    ],
    ["Compte", row.user_id ? "Actif" : "Supprimé (contrat conservé)"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/goo-admin/contrats" aria-label="Retour aux contrats" className={consoleButtonClass("ghost", "sm")}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.6} />
        </Link>
        <span className="text-[13px] text-white/45">Contrats</span>
      </div>

      <ConsoleHeader
        title={partyFromRow(row).displayName || row.signer_name}
        description={contract.title}
        actions={
          <a href={`/api/contrats/${row.id}`} download className={consoleButtonClass("primary", "md")}>
            Télécharger le PDF
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel>
          <ContractDocument contract={contract} />
        </Panel>

        <div className="space-y-6">
          <Panel title="Signature">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.signature_png} alt={`Signature de ${row.signer_name}`} className="h-28 w-full rounded-xl bg-white object-contain p-2" />
            <dl className="mt-4 space-y-3 text-[13px]">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-white/40">{k}</dt>
                  <dd className="mt-0.5 break-words text-white/85">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          {history.length > 1 ? (
            <Panel title="Historique des signatures">
              <ul className="space-y-2 text-[13px]">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3">
                    <span className="text-white/70">{dateTimeFmt.format(new Date(h.signed_at))}</span>
                    {h.id === row.id ? (
                      <span className="text-white/40">Affiché</span>
                    ) : (
                      <Link href={`/goo-admin/contrats/${h.id}`} className="text-white underline-offset-4 hover:underline">
                        Version {h.contract_version}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
