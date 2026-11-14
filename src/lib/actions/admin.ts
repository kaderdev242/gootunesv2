"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  notifyAccountReactivated,
  notifyAccountSuspended,
} from "@/lib/email/notify";
import { logServerError, mapDbError } from "@/lib/errors";
import { FEATURES, isFeatureKey } from "@/lib/features";
import type { LabelPlan, ReportStatus } from "@/lib/supabase/database.types";
import type { ActionState } from "./profile";

function touchAdmin(...extra: string[]) {
  revalidatePath("/goo-admin");
  revalidatePath("/goo-admin/artistes", "layout");
  for (const p of extra) revalidatePath(p);
  revalidatePath("/discover");
}

export async function setUserSuspended(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };

  const userId = String(formData.get("user_id") || "").trim();
  const suspended = String(formData.get("suspended") || "") === "true";
  if (!userId) return { error: "Utilisateur invalide." };
  if (userId === admin.userId) {
    return { error: "Tu ne peux pas te suspendre toi-même." };
  }

  const db = createAdminClient();
  const { data: target } = await db
    .from("profiles")
    .select("id, email, display_name, role, is_admin, is_suspended")
    .eq("id", userId)
    .maybeSingle();

  if (!target) return { error: "Utilisateur introuvable." };
  if (target.is_admin) {
    return { error: "Impossible de suspendre un administrateur." };
  }
  if (target.is_suspended === suspended) {
    return {
      success: suspended ? "Compte déjà suspendu." : "Compte déjà actif.",
    };
  }

  const { error } = await db
    .from("profiles")
    .update({ is_suspended: suspended })
    .eq("id", userId);

  if (error) {
    logServerError("admin.suspend", error);
    return { error: mapDbError(error, "Impossible de mettre à jour.") };
  }

  if (target.email) {
    if (suspended) {
      notifyAccountSuspended({
        email: target.email,
        displayName: target.display_name,
      });
    } else {
      notifyAccountReactivated({
        email: target.email,
        displayName: target.display_name,
        role: target.role,
      });
    }
  }

  touchAdmin("/goo-admin/fans", "/goo-admin/artistes", "/goo-admin/morceaux");
  return {
    success: suspended
      ? "Compte suspendu. Ses morceaux sont masqués. Un e-mail a été envoyé."
      : "Compte réactivé. Les morceaux masqués par la suspension sont remis en ligne. Un e-mail a été envoyé.",
  };
}

export async function setReleaseHidden(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };

  const releaseId = String(formData.get("release_id") || "").trim();
  const hidden = String(formData.get("hidden") || "") === "true";
  if (!releaseId) return { error: "Morceau invalide." };

  const db = createAdminClient();
  const { data: release } = await db
    .from("releases")
    .select("id, public_id, artist_id")
    .eq("id", releaseId)
    .maybeSingle();

  if (!release) return { error: "Publication introuvable." };

  // Hide admin : clear le flag suspension pour qu'une réactivation
  // ne remette pas en ligne un titre volontairement masqué.
  const { error } = await db
    .from("releases")
    .update(
      hidden
        ? { is_hidden: true, hidden_by_suspension: false }
        : { is_hidden: false, hidden_by_suspension: false },
    )
    .eq("id", releaseId);

  if (error) {
    logServerError("admin.hideRelease", error);
    return { error: mapDbError(error, "Impossible de mettre à jour.") };
  }

  touchAdmin(
    "/goo-admin/morceaux",
    "/goo-admin/artistes",
    `/goo-admin/artistes/${release.artist_id}`,
    `/discover/release/${release.public_id || release.id}`,
  );
  return {
    success: hidden ? "Morceau masqué." : "Morceau remis en ligne.",
  };
}

export async function deleteReleaseAdmin(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };

  const releaseId = String(formData.get("release_id") || "").trim();
  if (!releaseId) return { error: "Morceau invalide." };

  const db = createAdminClient();
  const { data: release } = await db
    .from("releases")
    .select("id, title")
    .eq("id", releaseId)
    .maybeSingle();

  if (!release) return { error: "Publication introuvable." };

  const { error } = await db.from("releases").delete().eq("id", releaseId);
  if (error) {
    logServerError("admin.deleteRelease", error);
    return { error: mapDbError(error, "Impossible de supprimer.") };
  }

  touchAdmin(
    "/goo-admin/morceaux",
    "/goo-admin/artistes",
    "/goo-admin/signalements",
  );
  return {
    success: `« ${release.title} » a été supprimé.`,
  };
}

export async function updateReportStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };

  const reportId = String(formData.get("report_id") || "").trim();
  const status = String(formData.get("status") || "").trim() as ReportStatus;
  const adminNote = String(formData.get("admin_note") || "").trim();
  const hideRelease = String(formData.get("hide_release") || "") === "true";

  const allowed: ReportStatus[] = [
    "open",
    "reviewing",
    "resolved",
    "dismissed",
  ];
  if (!reportId || !allowed.includes(status)) {
    return { error: "Signalement invalide." };
  }

  const db = createAdminClient();
  const { data: report, error: fetchErr } = await db
    .from("track_reports")
    .select("id, track_id")
    .eq("id", reportId)
    .maybeSingle();

  if (fetchErr || !report) {
    logServerError("admin.reportFetch", fetchErr);
    return { error: "Signalement introuvable." };
  }

  const closed = status === "resolved" || status === "dismissed";
  const { error } = await db
    .from("track_reports")
    .update({
      status,
      admin_note: adminNote,
      resolved_at: closed ? new Date().toISOString() : null,
      resolved_by: closed ? admin.userId : null,
    })
    .eq("id", reportId);

  if (error) {
    logServerError("admin.reportUpdate", error);
    return { error: mapDbError(error, "Impossible de mettre à jour.") };
  }

  if (hideRelease) {
    const { data: track } = await db
      .from("tracks")
      .select("release_id")
      .eq("id", report.track_id)
      .maybeSingle();
    if (track?.release_id) {
      await db
        .from("releases")
        .update({ is_hidden: true, hidden_by_suspension: false })
        .eq("id", track.release_id);
    }
  }

  touchAdmin("/goo-admin/signalements", "/goo-admin/morceaux");
  return { success: "Signalement mis à jour." };
}

export async function setMaintenance(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };

  const enabled = formData.get("enabled") === "true";
  const message = String(formData.get("message") || "").trim();

  if (message.length > 500) {
    return { error: "Message trop long (500 car. max)." };
  }

  const db = createAdminClient();
  const { error } = await db
    .from("site_settings")
    .update({
      maintenance_enabled: enabled,
      maintenance_message:
        message || "Gootunes est en maintenance. Reviens bientôt.",
      updated_at: new Date().toISOString(),
      updated_by: admin.userId,
    })
    .eq("id", 1);

  if (error) {
    logServerError("admin.maintenance", error);
    return { error: mapDbError(error, "Impossible de mettre à jour.") };
  }

  touchAdmin("/goo-admin/maintenance", "/maintenance");
  return {
    success: enabled
      ? "Mode maintenance activé."
      : "Mode maintenance désactivé.",
  };
}

function touchPlaylist(id: string) {
  touchAdmin("/goo-admin/playlists");
  revalidatePath("/discover/playlists");
  revalidatePath(`/discover/playlists/${id}`);
  revalidatePath("/", "layout");
}

export async function adminSetPlaylistPublic(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };
  const id = String(formData.get("playlist_id") || "").trim();
  const isPublic = String(formData.get("is_public") || "") === "true";
  if (!id) return { error: "Playlist invalide." };

  const db = createAdminClient();
  const { error } = await db
    .from("playlists")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    logServerError("admin.playlistPublic", error);
    return { error: mapDbError(error, "Impossible de mettre à jour.") };
  }
  touchPlaylist(id);
  return { success: isPublic ? "Playlist rendue publique." : "Playlist retirée de Discover." };
}

export async function adminUpdatePlaylist(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };
  const id = String(formData.get("playlist_id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const removeCover = formData.get("remove_cover") === "true";
  if (!id) return { error: "Playlist invalide." };
  if (!title) return { error: "Le titre est obligatoire." };
  if (title.length > 80) return { error: "Titre trop long (80 car. max)." };
  if (description.length > 400) return { error: "Description trop longue (400 car. max)." };

  const db = createAdminClient();
  const { error } = await db
    .from("playlists")
    .update({
      title,
      description,
      ...(removeCover ? { cover_url: null } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    logServerError("admin.playlistUpdate", error);
    return { error: mapDbError(error, "Impossible de mettre à jour.") };
  }
  touchPlaylist(id);
  return { success: "Playlist modifiée." };
}

export async function adminDeletePlaylist(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };
  const id = String(formData.get("playlist_id") || "").trim();
  if (!id) return { error: "Playlist invalide." };

  const db = createAdminClient();
  const { data: playlist } = await db.from("playlists").select("title").eq("id", id).maybeSingle();
  if (!playlist) return { error: "Playlist introuvable." };
  const { error } = await db.from("playlists").delete().eq("id", id);
  if (error) {
    logServerError("admin.playlistDelete", error);
    return { error: mapDbError(error, "Impossible de supprimer.") };
  }
  touchPlaylist(id);
  return { success: `« ${playlist.title} » a été supprimée.` };
}

export async function setFeatureEnabled(
  key: string,
  enabled: boolean,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };
  if (!isFeatureKey(key)) return { error: "Fonctionnalité inconnue." };

  const db = createAdminClient();
  const { error } = await db.from("feature_flags").upsert({
    key,
    enabled,
    updated_at: new Date().toISOString(),
    updated_by: admin.userId,
  });

  if (error) {
    logServerError("admin.feature", error);
    return { error: mapDbError(error, "Impossible de mettre à jour.") };
  }

  touchAdmin("/goo-admin/fonctionnalites");
  for (const p of FEATURES[key].paths) revalidatePath(p, "layout");
  return {
    success: `${FEATURES[key].name} ${enabled ? "activée" : "désactivée"}.`,
  };
}

export async function addEditorialHit(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { error: "Accès refusé." };

    const trackId = String(formData.get("track_id") || "").trim();
    const coverUrl = String(formData.get("cover_url") || "").trim() || null;
    const title = String(formData.get("title") || "").trim() || null;
    const publishNow = String(formData.get("publish_now") || "") === "true";
    if (!trackId) return { error: "Sélectionne un morceau." };
    if (title && title.length > 120) {
      return { error: "Titre trop long (120 car. max)." };
    }

    const db = createAdminClient();
    const { data: track } = await db
      .from("tracks")
      .select("id, release_id, releases!inner(status, is_hidden)")
      .eq("id", trackId)
      .maybeSingle();

    if (!track) return { error: "Morceau introuvable." };
    const release = Array.isArray(track.releases)
      ? track.releases[0]
      : track.releases;
    if (
      !release ||
      (release as { status?: string }).status !== "published" ||
      (release as { is_hidden?: boolean }).is_hidden
    ) {
      return { error: "Ce morceau n'est pas publié." };
    }

    const { data: existing } = await db
      .from("editorial_hits")
      .select("id")
      .eq("track_id", trackId)
      .maybeSingle();
    if (existing) return { error: "Ce morceau est déjà dans Les Hits." };

    const { data: last } = await db
      .from("editorial_hits")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await db.from("editorial_hits").insert({
      track_id: trackId,
      release_id: track.release_id,
      title,
      cover_url: coverUrl,
      position: (last?.position ?? -1) + 1,
      is_published: publishNow,
      created_by: admin.userId,
    });

    if (error) {
      logServerError("admin.addHit", error);
      const raw = String(
        (error as { message?: string }).message || "",
      ).toLowerCase();
      if (
        raw.includes("could not find the table") ||
        (raw.includes("editorial_hits") && raw.includes("schema cache"))
      ) {
        return {
          error:
            "Table Les Hits absente. Exécute la migration 014 dans Supabase.",
        };
      }
      if (raw.includes("title") && (raw.includes("column") || raw.includes("schema"))) {
        return {
          error:
            "Colonne titre absente. Exécute la migration 015 dans Supabase.",
        };
      }
      return { error: mapDbError(error, "Impossible d'ajouter le hit.") };
    }

    touchAdmin("/goo-admin/hits");
    return {
      success: publishNow
        ? "Hit publié sur Discover."
        : "Hit ajouté (brouillon). Utilise « Publier tout » pour le mettre en ligne.",
    };
  } catch (e) {
    logServerError("admin.addHit.throw", e);
    return { error: "Impossible d'ajouter le hit. Réessaie." };
  }
}

export async function updateEditorialHit(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };

  const hitId = String(formData.get("hit_id") || "").trim();
  if (!hitId) return { error: "Hit invalide." };

  const hasCover = formData.has("cover_url");
  const hasTitle = formData.has("title");
  const coverUrl = hasCover
    ? String(formData.get("cover_url") || "").trim() || null
    : undefined;
  const titleRaw = hasTitle ? String(formData.get("title") || "").trim() : undefined;
  if (titleRaw !== undefined && titleRaw.length > 120) {
    return { error: "Titre trop long (120 car. max)." };
  }

  const patch: {
    cover_url?: string | null;
    title?: string | null;
    updated_at: string;
  } = { updated_at: new Date().toISOString() };
  if (hasCover) patch.cover_url = coverUrl ?? null;
  if (hasTitle) patch.title = titleRaw || null;

  const db = createAdminClient();
  const { error } = await db
    .from("editorial_hits")
    .update(patch)
    .eq("id", hitId);

  if (error) {
    logServerError("admin.updateHit", error);
    return { error: mapDbError(error, "Impossible de mettre à jour.") };
  }

  touchAdmin("/goo-admin/hits");
  return { success: "Hit mis à jour." };
}

/** @deprecated use updateEditorialHit */
export async function updateEditorialHitCover(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return updateEditorialHit(_prev, formData);
}

export async function removeEditorialHit(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };

  const hitId = String(formData.get("hit_id") || "").trim();
  if (!hitId) return { error: "Hit invalide." };

  const db = createAdminClient();
  const { error } = await db.from("editorial_hits").delete().eq("id", hitId);
  if (error) {
    logServerError("admin.removeHit", error);
    return { error: mapDbError(error, "Impossible de retirer le hit.") };
  }

  touchAdmin("/goo-admin/hits");
  return { success: "Hit retiré." };
}

export async function moveEditorialHit(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };

  const hitId = String(formData.get("hit_id") || "").trim();
  const direction = String(formData.get("direction") || "").trim();
  if (!hitId || (direction !== "up" && direction !== "down")) {
    return { error: "Déplacement invalide." };
  }

  const db = createAdminClient();
  const { data: rows } = await db
    .from("editorial_hits")
    .select("id, position")
    .order("position", { ascending: true });

  const list = rows || [];
  const index = list.findIndex((r) => r.id === hitId);
  if (index < 0) return { error: "Hit introuvable." };

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= list.length) {
    return { success: "Déjà en bout de liste." };
  }

  const a = list[index];
  const b = list[swapWith];
  const now = new Date().toISOString();

  const { error: e1 } = await db
    .from("editorial_hits")
    .update({ position: b.position, updated_at: now })
    .eq("id", a.id);
  const { error: e2 } = await db
    .from("editorial_hits")
    .update({ position: a.position, updated_at: now })
    .eq("id", b.id);

  if (e1 || e2) {
    logServerError("admin.moveHit", e1 || e2);
    return { error: "Impossible de réordonner." };
  }

  touchAdmin("/goo-admin/hits");
  return { success: "Ordre mis à jour." };
}

export async function publishEditorialHits(
  _prev: ActionState = {},
  _formData?: FormData,
): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { error: "Accès refusé." };

    const db = createAdminClient();
    const { data: hits, error: listError } = await db
      .from("editorial_hits")
      .select("id");

    if (listError) {
      logServerError("admin.publishHits.list", listError);
      return {
        error: mapDbError(
          listError,
          "Impossible de lire Les Hits. Vérifie la migration SQL.",
        ),
      };
    }
    if (!hits?.length) {
      return {
        error:
          "Aucun hit dans la file. Sélectionne un morceau puis clique « Publier ce hit ».",
      };
    }

    const ids = hits.map((h) => h.id);
    const { error } = await db
      .from("editorial_hits")
      .update({
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (error) {
      logServerError("admin.publishHits", error);
      return { error: mapDbError(error, "Impossible de publier Les Hits.") };
    }

    touchAdmin("/goo-admin/hits");
    return { success: "Les Hits sont en ligne sur Discover." };
  } catch (e) {
    logServerError("admin.publishHits.throw", e);
    return { error: "Impossible de publier Les Hits. Réessaie." };
  }
}

export async function unpublishEditorialHits(
  _prev: ActionState = {},
  _formData?: FormData,
): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    if (!admin) return { error: "Accès refusé." };

    const db = createAdminClient();
    const { data: hits, error: listError } = await db
      .from("editorial_hits")
      .select("id");

    if (listError) {
      logServerError("admin.unpublishHits.list", listError);
      return {
        error: mapDbError(
          listError,
          "Impossible de lire Les Hits. Vérifie la migration SQL.",
        ),
      };
    }
    if (!hits?.length) {
      return { success: "Aucun hit à dépublier." };
    }

    const { error } = await db
      .from("editorial_hits")
      .update({
        is_published: false,
        updated_at: new Date().toISOString(),
      })
      .in(
        "id",
        hits.map((h) => h.id),
      );

    if (error) {
      logServerError("admin.unpublishHits", error);
      return { error: mapDbError(error, "Impossible de dépublier.") };
    }

    touchAdmin("/goo-admin/hits");
    return { success: "Section Les Hits retirée de Discover." };
  } catch (e) {
    logServerError("admin.unpublishHits.throw", e);
    return { error: "Impossible de dépublier. Réessaie." };
  }
}

export async function searchHitsCatalogAction(query: string) {
  const admin = await requireAdmin();
  if (!admin) return [] as Awaited<ReturnType<typeof searchCatalogForHits>>;
  const { searchCatalogForHits } = await import("@/lib/admin/queries");
  return searchCatalogForHits(query);
}

/** Active / révoque manuellement un abonnement artiste ou label. */
export async function adminSetCreatorPlan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };

  const userId = String(formData.get("user_id") || "").trim();
  const kind = String(formData.get("kind") || "").trim(); // artist | label
  const action = String(formData.get("action") || "").trim(); // activate | revoke
  const labelPlanRaw = String(formData.get("label_plan") || "unlimited").trim();
  const yearsRaw = Number(formData.get("years") || "1");
  const years = Number.isFinite(yearsRaw) && yearsRaw > 0 ? Math.min(yearsRaw, 10) : 1;

  if (!userId) return { error: "Compte invalide." };
  if (kind !== "artist" && kind !== "label") {
    return { error: "Type de compte invalide." };
  }

  const db = createAdminClient();
  const { data: target } = await db
    .from("profiles")
    .select("id, role, display_name, email, artist_plan, label_plan")
    .eq("id", userId)
    .maybeSingle();

  if (!target) return { error: "Compte introuvable." };

  if (kind === "artist" && target.role !== "artist") {
    return { error: "Ce compte n’est pas un artiste." };
  }
  if (kind === "label" && target.role !== "label") {
    return { error: "Ce compte n’est pas un label." };
  }

  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + years);

  if (kind === "artist") {
    const patch =
      action === "revoke"
        ? {
            artist_plan: "none" as const,
            artist_plan_expires_at: null,
          }
        : {
            artist_plan: "annual" as const,
            artist_plan_expires_at: expires.toISOString(),
          };

    const { error } = await db.from("profiles").update(patch).eq("id", userId);
    if (error) {
      logServerError("admin.artist_plan", error);
      return { error: mapDbError(error, "Impossible de mettre à jour l’abonnement.") };
    }

    touchAdmin("/goo-admin/artistes", "/artist", "/artist/abonnement");
    return {
      success:
        action === "revoke"
          ? "Abonnement artiste révoqué."
          : `Abonnement artiste activé jusqu’au ${expires.toLocaleDateString("fr-FR")}.`,
    };
  }

  const labelPlan: LabelPlan =
    labelPlanRaw === "starter" || labelPlanRaw === "unlimited"
      ? labelPlanRaw
      : "unlimited";

  const patch: {
    label_plan: LabelPlan;
    label_plan_expires_at: string | null;
  } =
    action === "revoke"
      ? {
          label_plan: "none",
          label_plan_expires_at: null,
        }
      : {
          label_plan: labelPlan,
          label_plan_expires_at: expires.toISOString(),
        };

  const { error } = await db.from("profiles").update(patch).eq("id", userId);
  if (error) {
    logServerError("admin.label_plan", error);
    return { error: mapDbError(error, "Impossible de mettre à jour l’abonnement.") };
  }

  touchAdmin("/goo-admin/artistes", "/label", "/label/abonnement");
  return {
    success:
      action === "revoke"
        ? "Abonnement label révoqué."
        : `Abonnement label « ${labelPlan} » activé jusqu’au ${expires.toLocaleDateString("fr-FR")}.`,
  };
}

/** Pose / retire le badge de certification sur un artiste catalogue. */
export async function adminSetArtistVerified(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Accès refusé." };

  const artistId = String(formData.get("artist_id") || "").trim();
  const verified = String(formData.get("verified") || "") === "true";
  if (!artistId) return { error: "Artiste invalide." };

  const db = createAdminClient();
  const { data: artist } = await db
    .from("artists")
    .select("id, stage_name, public_id, is_verified")
    .eq("id", artistId)
    .maybeSingle();

  if (!artist) return { error: "Artiste introuvable." };

  const { error } = await db
    .from("artists")
    .update({ is_verified: verified })
    .eq("id", artistId);

  if (error) {
    logServerError("admin.artist_verified", error);
    return { error: mapDbError(error, "Impossible de mettre à jour la certification.") };
  }

  touchAdmin(
    "/goo-admin/artistes",
    `/goo-admin/artistes/${artist.id}`,
    "/discover",
    "/discover/artistes",
    `/discover/artiste/${artist.public_id}`,
  );
  return {
    success: verified
      ? `Badge de certification ajouté pour « ${artist.stage_name} ».`
      : `Badge retiré pour « ${artist.stage_name} ».`,
  };
}
