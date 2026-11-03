import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { logServerError } from "@/lib/errors";
import { notifyLoginOtp } from "@/lib/email/notify";
import {
  createLoginChallenge,
  destroyChallenge,
  hashOtp,
  incrementAttempts,
  latestChallengeForUser,
  loadChallenge,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_MS,
  otpEquals,
  parseSessionPayload,
} from "@/lib/creator/otp";
import { publicCreatorProfile } from "@/lib/creator/require-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = clientIpFromHeaders(request.headers);
    const rl = await checkRateLimit(`creator:otp:${ip}`, 20, 60_000, {
      strict: true,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessaie dans une minute.", code: "RATE_LIMIT" },
        { status: 429 },
      );
    }

    let body: {
      action?: string;
      challenge_id?: string;
      code?: string;
    } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
    }

    const action = String(body.action || "verify");
    const challengeId = String(body.challenge_id || "").trim();
    if (!challengeId) {
      return NextResponse.json({ error: "Challenge manquant." }, { status: 400 });
    }

    const challenge = await loadChallenge(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { error: "Code expiré. Reconnecte-toi.", code: "OTP_EXPIRED" },
        { status: 400 },
      );
    }

    if (new Date(challenge.expires_at).getTime() < Date.now()) {
      await destroyChallenge(challenge.id);
      return NextResponse.json(
        { error: "Code expiré. Reconnecte-toi.", code: "OTP_EXPIRED" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", challenge.user_id)
      .maybeSingle();

    if (!profile) {
      await destroyChallenge(challenge.id);
      return NextResponse.json({ error: "Profil introuvable." }, { status: 401 });
    }
    if (profile.role !== "artist" && profile.role !== "label") {
      await destroyChallenge(challenge.id);
      return NextResponse.json(
        { error: "Cette application est réservée aux artistes et labels.", code: "FAN_FORBIDDEN" },
        { status: 403 },
      );
    }
    if (profile.is_suspended && !profile.is_admin) {
      await destroyChallenge(challenge.id);
      return NextResponse.json(
        { error: "Ton compte a été suspendu.", code: "ACCOUNT_SUSPENDED" },
        { status: 403 },
      );
    }

    if (action === "resend") {
      const latest = await latestChallengeForUser(profile.id);
      if (
        latest &&
        Date.now() - new Date(latest.created_at).getTime() < OTP_RESEND_MS
      ) {
        return NextResponse.json(
          { error: "Attends une minute avant de renvoyer le code.", code: "RATE_LIMIT" },
          { status: 429 },
        );
      }

      const session = parseSessionPayload(challenge.session_payload);
      if (!session) {
        return NextResponse.json(
          { error: "Session expirée. Reconnecte-toi.", code: "OTP_EXPIRED" },
          { status: 400 },
        );
      }

      const next = await createLoginChallenge({
        userId: profile.id,
        session,
      });
      if (profile.email) {
        notifyLoginOtp({
          email: profile.email,
          displayName: profile.display_name,
          code: next.code,
        });
      }
      return NextResponse.json({
        needs_otp: true,
        challenge_id: next.challengeId,
        success: "Nouveau code envoyé.",
      });
    }

    const code = String(body.code || "").replace(/\D/g, "");
    if (code.length !== 6) {
      return NextResponse.json({ error: "Code à 6 chiffres requis." }, { status: 400 });
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      await destroyChallenge(challenge.id);
      return NextResponse.json(
        { error: "Trop de tentatives. Reconnecte-toi.", code: "OTP_LOCKED" },
        { status: 429 },
      );
    }

    if (!otpEquals(hashOtp(code), challenge.code_hash)) {
      await incrementAttempts(challenge.id, challenge.attempts);
      return NextResponse.json(
        { error: "Code incorrect.", code: "OTP_INVALID" },
        { status: 400 },
      );
    }

    const session = parseSessionPayload(challenge.session_payload);
    if (!session) {
      await destroyChallenge(challenge.id);
      return NextResponse.json(
        { error: "Session expirée. Reconnecte-toi.", code: "OTP_EXPIRED" },
        { status: 400 },
      );
    }

    await admin
      .from("profiles")
      .update({ login_otp_verified_at: new Date().toISOString() })
      .eq("id", profile.id);

    await destroyChallenge(challenge.id);

    return NextResponse.json({
      needs_otp: false,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      profile: publicCreatorProfile({
        ...profile,
        login_otp_verified_at: new Date().toISOString(),
      }),
    });
  } catch (e) {
    logServerError("creator.otp", e);
    return NextResponse.json({ error: "Vérification impossible." }, { status: 500 });
  }
}
