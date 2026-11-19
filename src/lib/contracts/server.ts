import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIpFromHeaders } from "@/lib/rate-limit";
import type { CreatorContract } from "@/lib/supabase/database.types";
import {
  buildContract,
  contractCanonicalText,
  CONTRACT_VERSION,
  type Contract,
  type ContractParty,
  type ContractRole,
} from "./template";

const SIGNATURE_PREFIX = "data:image/png;base64,";
const SIGNATURE_MAX = 400_000;

export type SignatureInput = {
  legalName: string;
  city: string;
  signaturePng: string;
  accepted: boolean;
};

/** Lit et vérifie les champs de signature envoyés par un formulaire. */
export function readSignatureForm(formData: FormData): SignatureInput & { error?: string } {
  const input: SignatureInput = {
    legalName: String(formData.get("contract_legal_name") || "").trim().slice(0, 160),
    city: String(formData.get("contract_city") || "").trim().slice(0, 80),
    signaturePng: String(formData.get("contract_signature") || ""),
    accepted: formData.get("contract_accept") === "on",
  };
  if (input.legalName.length < 2) return { ...input, error: "Indique ton nom et prénom légaux pour le contrat." };
  if (!input.accepted) return { ...input, error: "Coche la case pour accepter le contrat." };
  if (
    !input.signaturePng.startsWith(SIGNATURE_PREFIX) ||
    input.signaturePng.length > SIGNATURE_MAX ||
    input.signaturePng.length < SIGNATURE_PREFIX.length + 200
  ) {
    return { ...input, error: "Signe le contrat dans le cadre prévu." };
  }
  return input;
}

export function contractHash(contract: Contract): string {
  return createHash("sha256").update(contractCanonicalText(contract), "utf8").digest("hex");
}

export function partyFromRow(row: Pick<CreatorContract, "party">): ContractParty {
  const p = (row.party ?? {}) as Partial<ContractParty>;
  return {
    legalName: String(p.legalName ?? ""),
    displayName: String(p.displayName ?? ""),
    email: String(p.email ?? ""),
    phone: String(p.phone ?? ""),
    country: String(p.country ?? ""),
    city: String(p.city ?? ""),
  };
}

/** Contrat tel qu'il a été signé (reconstruit à partir de l'instantané). */
export function contractFromRow(row: CreatorContract): Contract {
  return buildContract(row.role, partyFromRow(row));
}

/**
 * Enregistre la signature (service role). Idempotent pour une même version :
 * une nouvelle signature de la même version remplace la précédente.
 */
export async function recordContractSignature(params: {
  userId: string;
  role: ContractRole;
  party: ContractParty;
  signaturePng: string;
}): Promise<{ error?: string; id?: string }> {
  const contract = buildContract(params.role, params.party);
  const h = await headers();
  const ip = clientIpFromHeaders(h);

  const { data, error } = await createAdminClient()
    .from("creator_contracts")
    .upsert(
      {
        user_id: params.userId,
        role: params.role,
        contract_version: CONTRACT_VERSION,
        party: params.party,
        signer_name: params.party.legalName,
        signature_png: params.signaturePng,
        content_hash: contractHash(contract),
        signed_ip: ip === "anonymous" ? null : ip,
        signed_user_agent: h.get("user-agent")?.slice(0, 400) ?? null,
        signed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,contract_version" },
    )
    .select("id")
    .single();

  if (error || !data) return { error: "Impossible d'enregistrer la signature du contrat." };
  return { id: data.id };
}

/** Dernier contrat signé par un créateur (toutes versions). */
export async function getLatestContract(userId: string): Promise<CreatorContract | null> {
  const { data } = await createAdminClient()
    .from("creator_contracts")
    .select("*")
    .eq("user_id", userId)
    .order("signed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function getContractById(id: string): Promise<CreatorContract | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await createAdminClient().from("creator_contracts").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
