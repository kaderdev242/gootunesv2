import type { Json } from "@/lib/supabase/database.types";
import { MbiyoApiError } from "./client";

/**
 * Motif d'échec d'un payin, stocké dans provider_meta pour que l'admin voie
 * pourquoi une commande a échoué (refus Mbiyo / opérateur, abandon, etc.).
 */

/** Appel payin rejeté (400 de routage, 422 de validation, 200 « Initiation failed », réseau). */
export function payinErrorFailure(e: unknown): {
  transactionId: string | null;
  meta: Json;
} {
  const reason = e instanceof Error ? e.message : String(e);
  return {
    transactionId: e instanceof MbiyoApiError ? e.transactionId : null,
    meta: {
      source: "payin_error",
      reason: reason.slice(0, 300),
      http_status: e instanceof MbiyoApiError ? e.httpStatus : null,
    },
  };
}

/** Statut final failed / cancelled reçu de Mbiyo (réponse payin ou suivi). */
export function statusFailure(
  source: "payin_immediate" | "poll",
  status: string,
  message?: string | null,
): Json {
  return {
    source,
    verified_status: status,
    ...(message ? { reason: message.slice(0, 300) } : {}),
  };
}

/** Libellé court pour l'admin, à partir de provider_meta. */
export function describeFailure(meta: unknown): string | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const m = meta as Record<string, unknown>;
  const reason = typeof m.reason === "string" ? m.reason : null;
  const status =
    typeof m.verified_status === "string" ? m.verified_status : null;

  switch (m.source) {
    case "ttl_expire":
      return "Non validé par le client (expiré après 5 min)";
    case "payin_error":
      return reason ? `Refusé : ${reason}` : "Refusé par Mbiyo";
    case "payin_immediate":
      return reason
        ? `Refusé par l'opérateur : ${reason}`
        : "Refusé par l'opérateur";
    case "webhook":
    case "poll":
      return status === "cancelled"
        ? "Annulé par le client ou l'opérateur"
        : "Échec confirmé par Mbiyo (solde, PIN ou refus)";
    default:
      return reason;
  }
}
