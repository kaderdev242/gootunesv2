import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCreatorSession, requireCreatorApi } from "@/lib/creator/require-api";
import { contactInbox, sendEmailSafe } from "@/lib/email/client";
import { logServerError } from "@/lib/errors";
import { escapeHtml } from "@/lib/email/layout";

export const dynamic = "force-dynamic";

const REASONS = new Set([
  "not_using",
  "privacy",
  "too_expensive",
  "missing_features",
  "other",
]);

/**
 * Demande de suppression d'un compte artiste ou label (app Gootunes Artistes).
 *
 * Pas de suppression immédiate : effacer le compte effacerait en cascade les
 * sorties, donc les achats des fans. On retire tout de suite les sorties de la
 * vente, on enregistre la demande et l'équipe la traite (30 jours au plus).
 */
export async function POST(request: Request) {
  const session = await requireCreatorApi(request);
  if (!isCreatorSession(session)) return session;

  let body: { reason?: unknown; details?: unknown; confirm?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const reason = String(body.reason ?? "").trim();
  const details = String(body.details ?? "").trim().slice(0, 1000);
  if (!REASONS.has(reason)) {
    return NextResponse.json({ error: "Choisis un motif." }, { status: 400 });
  }
  if (body.confirm !== "SUPPRIMER") {
    return NextResponse.json({ error: "Confirmation manquante." }, { status: 400 });
  }
  if ((Number(session.profile.balance_fcfa) || 0) > 0) {
    return NextResponse.json(
      { error: "Retire d'abord ton solde : il serait perdu avec le compte." },
      { status: 400 },
    );
  }

  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: feedbackError } = await (admin as any)
      .from("account_deletion_feedback")
      .insert({
        user_id: session.userId,
        email: session.profile.email ?? "",
        reason,
        details: `[demande créateur ${session.profile.role}] ${details}`.trim(),
      });
    if (feedbackError) {
      logServerError("creator.account.delete.feedback", feedbackError);
      return NextResponse.json({ error: "Demande impossible. Réessaie." }, { status: 500 });
    }

    const { error: hideError } = await admin
      .from("releases")
      .update({ is_hidden: true })
      .eq("owner_id", session.userId);
    if (hideError) logServerError("creator.account.delete.hide", hideError);

    sendEmailSafe({
      to: contactInbox(),
      subject: `Demande de suppression de compte (${session.profile.role})`,
      html: `<p>${escapeHtml(session.profile.display_name ?? "—")} (${escapeHtml(session.profile.email ?? "—")}) demande la suppression de son compte ${session.profile.role}.</p><p>Motif : ${reason}</p><p>ID : ${session.userId}</p><p>Sorties déjà retirées de la vente. À traiter sous 30 jours.</p>`,
      text: `Demande de suppression : ${session.profile.email} (${session.userId}), motif ${reason}.`,
    });

    return NextResponse.json({
      success: "Demande enregistrée",
      message:
        "Tes sorties sont retirées de la vente. Ton compte et tes données seront supprimés sous 30 jours.",
    });
  } catch (e) {
    logServerError("creator.account.delete", e);
    return NextResponse.json({ error: "Demande impossible. Réessaie." }, { status: 500 });
  }
}
