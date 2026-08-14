import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRequestClient } from "@/lib/supabase/request-client";
import { logServerError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const REASONS = new Set([
  "not_using",
  "privacy",
  "too_expensive",
  "missing_features",
  "other",
]);

export async function POST(request: Request) {
  try {
    const supabase = await createRequestClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    let body: { reason?: string; details?: string } = {};
    try {
      body = (await request.json()) as { reason?: string; details?: string };
    } catch {
      body = {};
    }

    const reason = String(body.reason || "").trim();
    const details = String(body.details || "").trim().slice(0, 1000);

    if (!REASONS.has(reason)) {
      return NextResponse.json(
        { error: "Choisis un motif de suppression." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Table ajoutée en migration 013 — pas encore dans database.types générés
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: feedbackError } = await (admin as any)
      .from("account_deletion_feedback")
      .insert({
        user_id: user.id,
        email: user.email ?? "",
        reason,
        details,
      });

    if (feedbackError) {
      logServerError("account.delete.feedback", feedbackError);
      // On continue la suppression même si le feedback échoue
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      logServerError("account.delete.user", deleteError);
      return NextResponse.json(
        { error: "Impossible de supprimer le compte." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    logServerError("account.delete", e);
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression." },
      { status: 500 },
    );
  }
}
