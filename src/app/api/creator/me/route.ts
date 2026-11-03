import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import { isMusicGenre } from "@/lib/genres";
import { logServerError, mapDbError } from "@/lib/errors";
import {
  creatorError,
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

export async function PATCH(request: Request) {
  const session = await requireCreatorApi(request, { money: true });
  if (!isCreatorSession(session)) return session;

  let body: { phone?: string; bio?: string; genres?: string[] } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const phone = String(body.phone || "").trim();
  const bio = String(body.bio || "").trim();
  const genres = Array.isArray(body.genres)
    ? body.genres.map((g) => String(g).trim()).filter((g) => g && isMusicGenre(g))
    : [];

  const supabase = await createRequestClient(request);
  const { data, error } = await supabase
    .from("profiles")
    .update({
      phone: phone || null,
      bio: bio || null,
      genres,
    })
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

  if (!data.onboarding_completed) {
    return creatorError({
      status: 403,
      code: "ONBOARDING_REQUIRED",
      error: "Termine ton onboarding sur gootunes.com/onboarding.",
    });
  }

  return NextResponse.json({
    profile: publicCreatorProfile(data),
    payout: payoutMeta(data),
    success: "Profil mis à jour.",
  });
}
