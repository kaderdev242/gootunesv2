import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { logServerError } from "@/lib/errors";
import { notifyLoginOtp } from "@/lib/email/notify";
import { createLoginChallenge } from "@/lib/creator/otp";
import { publicCreatorProfile } from "@/lib/creator/require-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = clientIpFromHeaders(request.headers);
    const rl = await checkRateLimit(`creator:login:${ip}`, 10, 60_000, {
      strict: true,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessaie dans une minute.", code: "RATE_LIMIT" },
        { status: 429 },
      );
    }

    let body: { email?: string; password?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
    }

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis." },
        { status: 400 },
      );
    }

    const perEmail = await checkRateLimit(`creator:login:email:${email}`, 8, 60_000, {
      strict: true,
    });
    if (!perEmail.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessaie dans une minute.", code: "RATE_LIMIT" },
        { status: 429 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return NextResponse.json({ error: "Auth indisponible." }, { status: 500 });
    }

    const auth = createClient<Database>(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await auth.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect.", code: "INVALID_CREDENTIALS" },
        { status: 401 },
      );
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) {
      try {
        await admin.auth.admin.signOut(data.session.access_token);
      } catch {
        /* ignore */
      }
      return NextResponse.json(
        { error: "Profil introuvable.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }

    if (profile.role !== "artist" && profile.role !== "label") {
      try {
        await admin.auth.admin.signOut(data.session.access_token);
      } catch {
        /* ignore */
      }
      return NextResponse.json(
        {
          error: "Cette application est réservée aux artistes et labels. Utilise Gootunes pour les fans.",
          code: "FAN_FORBIDDEN",
        },
        { status: 403 },
      );
    }

    if (profile.is_suspended && !profile.is_admin) {
      try {
        await admin.auth.admin.signOut(data.session.access_token);
      } catch {
        /* ignore */
      }
      return NextResponse.json(
        { error: "Ton compte a été suspendu.", code: "ACCOUNT_SUSPENDED" },
        { status: 403 },
      );
    }

    const session = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };

    if (profile.login_otp_verified_at) {
      return NextResponse.json({
        needs_otp: false,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        profile: publicCreatorProfile(profile),
      });
    }

    const challenge = await createLoginChallenge({
      userId: profile.id,
      session,
    });

    if (profile.email) {
      notifyLoginOtp({
        email: profile.email,
        displayName: profile.display_name,
        code: challenge.code,
      });
    }

    return NextResponse.json({
      needs_otp: true,
      challenge_id: challenge.challengeId,
      email_hint: profile.email
        ? profile.email.replace(/(.{2}).+(@.+)/, "$1•••$2")
        : null,
    });
  } catch (e) {
    logServerError("creator.login", e);
    return NextResponse.json({ error: "Connexion impossible." }, { status: 500 });
  }
}
