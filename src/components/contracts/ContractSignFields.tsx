"use client";

import { useMemo } from "react";
import { ContractDocument } from "@/components/contracts/ContractDocument";
import { SignaturePad } from "@/components/contracts/SignaturePad";
import { buildContract, type ContractParty, type ContractRole } from "@/lib/contracts/template";

export type ContractSignState = {
  legalName: string;
  city: string;
  signature: string | null;
  accepted: boolean;
};

export const EMPTY_SIGN_STATE: ContractSignState = { legalName: "", city: "", signature: null, accepted: false };

const field =
  "h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-[15px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/30";

/**
 * Contrat prérempli + champs de signature. Les valeurs partent dans le formulaire
 * parent via des champs cachés (contract_legal_name, contract_city, contract_signature, contract_accept).
 */
export function ContractSignFields({
  role,
  party,
  value,
  onChange,
}: {
  role: ContractRole;
  /** Infos déjà connues (nom de scène, contact, pays). */
  party: Omit<ContractParty, "legalName" | "city">;
  value: ContractSignState;
  onChange: (next: ContractSignState) => void;
}) {
  const contract = useMemo(
    () => buildContract(role, { ...party, legalName: value.legalName, city: value.city }),
    [role, party, value.legalName, value.city],
  );
  const set = (patch: Partial<ContractSignState>) => onChange({ ...value, ...patch });

  return (
    <div className="flex flex-col gap-5">
      <input type="hidden" name="contract_legal_name" value={value.legalName} />
      <input type="hidden" name="contract_city" value={value.city} />
      <input type="hidden" name="contract_signature" value={value.signature ?? ""} />
      {value.accepted ? <input type="hidden" name="contract_accept" value="on" /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-white/70">
            {role === "label" ? "Représentant légal (nom et prénom)" : "Nom et prénom légaux"}
          </span>
          <input
            value={value.legalName}
            onChange={(e) => set({ legalName: e.target.value })}
            maxLength={160}
            autoComplete="name"
            placeholder="Ex. Grâce Mabiala"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-white/70">Ville (facultatif)</span>
          <input
            value={value.city}
            onChange={(e) => set({ city: e.target.value })}
            maxLength={80}
            autoComplete="address-level2"
            placeholder="Ex. Brazzaville"
            className={field}
          />
        </label>
      </div>

      <div
        tabIndex={0}
        aria-label="Texte intégral du contrat"
        className="max-h-[380px] overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-4 outline-none focus:border-white/25 sm:p-5"
      >
        <ContractDocument contract={contract} compact />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-white/75">
        <input
          type="checkbox"
          checked={value.accepted}
          onChange={(e) => set({ accepted: e.target.checked })}
          className="mt-0.5 size-4 shrink-0 accent-white"
        />
        <span>J&apos;ai lu l&apos;intégralité du contrat et j&apos;en accepte les conditions.</span>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-white/70">Ta signature</span>
        <SignaturePad initial={value.signature} onChange={(signature) => set({ signature })} />
      </div>
    </div>
  );
}

export function signStateError(v: ContractSignState): string | null {
  if (v.legalName.trim().length < 2) return "Indique ton nom et prénom légaux.";
  if (!v.accepted) return "Coche la case pour accepter le contrat.";
  if (!v.signature) return "Signe le contrat dans le cadre prévu.";
  return null;
}
