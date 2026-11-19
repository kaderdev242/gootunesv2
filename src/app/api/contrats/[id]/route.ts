import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { contractFromRow, getContractById, partyFromRow } from "@/lib/contracts/server";
import { pdfResponse, renderContractPdf } from "@/lib/contracts/pdf";
import { slugify } from "@/lib/blog/content";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** PDF d'un contrat signé : réservé au signataire et aux administrateurs. */
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const row = await getContractById(id);
  if (!row) return NextResponse.json({ error: "Contrat introuvable." }, { status: 404 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = Boolean(user && row.user_id === user.id);
  if (!isOwner && !(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const contract = contractFromRow(row);
  const pdf = await renderContractPdf(contract, {
    signerName: row.signer_name,
    signaturePng: row.signature_png,
    signedAt: row.signed_at,
    contentHash: row.content_hash,
    ip: row.signed_ip,
  });
  const name = slugify(partyFromRow(row).displayName) || "createur";
  return pdfResponse(pdf, `contrat-gootunes-${name}-${row.contract_version}.pdf`);
}
