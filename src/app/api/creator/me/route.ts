import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import { isMusicGenre } from "@/lib/genres";
import { logServerError, mapDbError } from "@/lib/errors";
import {
  isCreatorSession,
  payoutMeta,
  publicCreatorProfile,
  requireCreatorApi,
} from "@/lib/creator/require-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await requireCreatorApi(request);
  if (!isCreatorSession(session)) return session;
  return NextResponse.json({
    profile: publicCreatorProfile(session.profile),
    payout: payoutMeta(session.profile),
  });
}

/** Avatar envoyé par cet utilisateur via /api/upload (kind avatar). */
function isOwnAvatarUrl(url: string, userId: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const base = (process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").trim();
    if (base && u.host !== new URL(base).host) return false;
    return u.pathname.includes(`/avatars/${userId}/`);
  } catch {
    return false;
  }
}

export async function PATCH(request: Request) {
  // Modifier son profil ne demande pas d'avoir terminé l'onboarding paiement.
  const session = await requireCreatorApi(request);
  if (!isCreatorSession(session)) return session;

  let body: { phone?: unknown; bio?: unknown; genres?: unknown; avatar_url?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const phone = String(body.phone ?? "").trim();
  const bio = String(body.bio ?? "").trim();
  if (phone && !/^\+?[0-9 ]{6,20}$/.test(phone)) {
    return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
  }
  if (bio.length > 500) {
    return NextResponse.json({ error: "Bio trop longue (500 caractères max)." }, { status: 400 });
  }
  const genres = Array.isArray(body.genres)
    ? [...new Set(body.genres.map((g) => String(g).trim()).filter((g) => g && isMusicGenre(g)))].slice(0, 5)
    : (session.profile.genres ?? []);

  const update: { phone: string | null; bio: string | null; genres: string[]; avatar_url?: string | null } = {
    phone: phone || null,
    bio: bio || null,
    genres,
  };
  // avatar_url absent = inchangé ; présent = doit venir de nos envois.
  if (body.avatar_url !== undefined) {
    const avatar = String(body.avatar_url ?? "").trim();
    if (avatar && !isOwnAvatarUrl(avatar, session.userId)) {
      return NextResponse.json({ error: "Photo invalide." }, { status: 400 });
    }
    update.avatar_url = avatar || null;
  }

  const supabase = await createRequestClient(request);
  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", session.userId)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    logServerError("creator.me.patch", error);
    return NextResponse.json(
      { error: mapDbError(error, "Impossible de mettre à jour.") },
      { status: 400 },
    );
  }

  return NextResponse.json({
    profile: publicCreatorProfile(data),
    payout: payoutMeta(data),
    success: "Profil mis à jour",
  });
}
