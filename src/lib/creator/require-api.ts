import { NextResponse } from "next/server";
import { createRequestClient } from "@/lib/supabase/request-client";
import type { Profile } from "@/lib/supabase/database.types";
import { getOperatorsForCountry } from "@/lib/constants";
import {
  currencyLabelForCountry,
  fcfaToLocal,
} from "@/lib/currency";
import { getMbiyoMinAmount } from "@/lib/mbiyo/config";

export type CreatorSession = {
  userId: string;
  profile: Profile;
};

export type CreatorApiError =
  | { status: 401; code: "UNAUTHENTICATED"; error: string }
  | { status: 403; code: "FAN_FORBIDDEN"; error: string }
  | { status: 403; code: "ACCOUNT_SUSPENDED"; error: string }
  | { status: 403; code: "OTP_REQUIRED"; error: string }
  | { status: 403; code: "ONBOARDING_REQUIRED"; error: string };

export function creatorError(err: CreatorApiError) {
  return NextResponse.json(
    { error: err.error, code: err.code },
    { status: err.status },
  );
}

export function publicCreatorProfile(profile: Profile) {
  return {
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    role: profile.role,
    country: profile.country,
    phone: profile.phone,
    bio: profile.bio,
    genres: profile.genres,
    onboarding_completed: profile.onboarding_completed,
    artist_plan: profile.artist_plan,
    artist_plan_expires_at: profile.artist_plan_expires_at,
    label_plan: profile.label_plan,
    label_plan_expires_at: profile.label_plan_expires_at,
    balance_fcfa: Number(profile.balance_fcfa) || 0,
    login_otp_verified_at: profile.login_otp_verified_at,
  };
}

export function payoutMeta(profile: Profile) {
  return {
    operators: getOperatorsForCountry(profile.country).map((o) => ({
      id: o.id,
      label: o.label,
    })),
    min_amount_local: getMbiyoMinAmount(profile.country),
    currency_label: currencyLabelForCountry(profile.country),
    balance_local: fcfaToLocal(Number(profile.balance_fcfa) || 0, profile.country),
  };
}

export async function requireCreatorApi(
  request: Request,
  opts?: { money?: boolean },
): Promise<CreatorSession | NextResponse> {
  const supabase = await createRequestClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return creatorError({
      status: 401,
      code: "UNAUTHENTICATED",
      error: "Non authentifié.",
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return creatorError({
      status: 401,
      code: "UNAUTHENTICATED",
      error: "Profil introuvable.",
    });
  }

  if (profile.role !== "artist" && profile.role !== "label") {
    return creatorError({
      status: 403,
      code: "FAN_FORBIDDEN",
      error: "Cette application est réservée aux artistes et labels.",
    });
  }

  if (profile.is_suspended && !profile.is_admin) {
    return creatorError({
      status: 403,
      code: "ACCOUNT_SUSPENDED",
      error: "Ton compte a été suspendu.",
    });
  }

  if (!profile.login_otp_verified_at) {
    return creatorError({
      status: 403,
      code: "OTP_REQUIRED",
      error: "Confirme le code envoyé par e-mail.",
    });
  }

  if (opts?.money && !profile.onboarding_completed) {
    return creatorError({
      status: 403,
      code: "ONBOARDING_REQUIRED",
      error: "Termine ton onboarding sur gootunes.com/onboarding.",
    });
  }

  return { userId: user.id, profile };
}

export function isCreatorSession(
  value: CreatorSession | NextResponse,
): value is CreatorSession {
  return "userId" in value;
}
