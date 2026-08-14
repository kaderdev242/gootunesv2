"use server";

import { createClient } from "@/lib/supabase/server";
import { logServerError, mapDbError } from "@/lib/errors";
import type { ReportReason } from "@/lib/supabase/database.types";
import type { ActionState } from "./profile";

const REASONS: ReportReason[] = [
  "copyright",
  "illegal",
  "spam",
  "hate",
  "other",
];

export async function reportTrack(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const trackId = String(formData.get("track_id") || "").trim();
  const reasonRaw = String(formData.get("reason") || "").trim();
  const details = String(formData.get("details") || "").trim();

  if (!trackId) return { error: "Morceau invalide." };
  if (!REASONS.includes(reasonRaw as ReportReason)) {
    return { error: "Choisis un motif de signalement." };
  }
  if (details.length > 1000) {
    return { error: "Détails trop longs (1000 car. max)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connecte-toi pour signaler un morceau." };

  const { data: track } = await supabase
    .from("tracks")
    .select("id")
    .eq("id", trackId)
    .maybeSingle();
  if (!track) return { error: "Morceau introuvable." };

  const { error } = await supabase.from("track_reports").insert({
    track_id: trackId,
    reporter_id: user.id,
    reason: reasonRaw as ReportReason,
    details,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Tu as déjà signalé ce morceau." };
    }
    logServerError("reports.track", error);
    return { error: mapDbError(error, "Impossible d'envoyer le signalement.") };
  }

  return { success: "Signalement envoyé. Merci." };
}
