import { createAdminClient } from "@/lib/supabase/admin";
import { CONTRACT_VERSION } from "./template";

export type AdminContractStatus = "signed" | "outdated" | "missing";

export type AdminContractRow = {
  /** Créateur (null si le compte a été supprimé après signature). */
  userId: string | null;
  name: string;
  email: string;
  role: "artist" | "label";
  avatarUrl: string | null;
  status: AdminContractStatus;
  contractId: string | null;
  version: string | null;
  signerName: string | null;
  signedAt: string | null;
};

/** Tous les artistes et labels avec l'état de leur contrat (dernière signature). */
export async function listContractsAdmin(): Promise<AdminContractRow[]> {
  const db = createAdminClient();
  const [{ data: creators }, { data: contracts }] = await Promise.all([
    db
      .from("profiles")
      .select("id, display_name, email, role, avatar_url, created_at")
      .in("role", ["artist", "label"])
      .order("created_at", { ascending: false })
      .limit(5000),
    db
      .from("creator_contracts")
      .select("id, user_id, role, contract_version, signer_name, signed_at, party")
      .order("signed_at", { ascending: false })
      .limit(10000),
  ]);

  const latest = new Map<string, NonNullable<typeof contracts>[number]>();
  const orphans: NonNullable<typeof contracts> = [];
  for (const c of contracts ?? []) {
    if (!c.user_id) orphans.push(c);
    else if (!latest.has(c.user_id)) latest.set(c.user_id, c);
  }

  const rows: AdminContractRow[] = (creators ?? []).map((p) => {
    const c = latest.get(p.id);
    return {
      userId: p.id,
      name: p.display_name || p.email || "Sans nom",
      email: p.email ?? "",
      role: p.role === "label" ? "label" : "artist",
      avatarUrl: p.avatar_url,
      status: !c ? "missing" : c.contract_version === CONTRACT_VERSION ? "signed" : "outdated",
      contractId: c?.id ?? null,
      version: c?.contract_version ?? null,
      signerName: c?.signer_name ?? null,
      signedAt: c?.signed_at ?? null,
    };
  });

  for (const c of orphans) {
    const party = (c.party ?? {}) as { displayName?: string; email?: string };
    rows.push({
      userId: null,
      name: party.displayName || c.signer_name,
      email: party.email ?? "",
      role: c.role,
      avatarUrl: null,
      status: c.contract_version === CONTRACT_VERSION ? "signed" : "outdated",
      contractId: c.id,
      version: c.contract_version,
      signerName: c.signer_name,
      signedAt: c.signed_at,
    });
  }

  return rows;
}

/** Historique des signatures d'un créateur (toutes versions). */
export async function listContractHistory(userId: string) {
  const { data } = await createAdminClient()
    .from("creator_contracts")
    .select("id, contract_version, signed_at")
    .eq("user_id", userId)
    .order("signed_at", { ascending: false });
  return data ?? [];
}
