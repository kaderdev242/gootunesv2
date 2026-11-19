import { buildContract } from "@/lib/contracts/template";
import { pdfResponse, renderContractPdf } from "@/lib/contracts/pdf";

export const runtime = "nodejs";

/** Modèle vierge du contrat (page publique /contrat). */
export async function GET(request: Request) {
  const role = new URL(request.url).searchParams.get("role") === "label" ? "label" : "artist";
  const pdf = await renderContractPdf(buildContract(role, null), null);
  return pdfResponse(pdf, `contrat-gootunes-${role === "label" ? "label" : "artiste"}.pdf`);
}
