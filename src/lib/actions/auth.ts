"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { creatorHome } from "@/lib/dashboard/paths";
import { notifyWelcome } from "@/lib/email/notify";
import { logServerError, mapAuthError } from "@/lib/errors";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";
import { signInSchema, signUpSchema } from "@/lib/validation/schemas";
import type { UserRole } from "@/lib/supabase/database.types";

export type AuthState = {
  error?: string;
  success?: string;
};

async function authClientIp() {
  const h = await headers();
  return clientIpFromHeaders(h);
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Données invalides." };
  }

  const { email, password, next } = parsed.data;
  const ip = await authClientIp();
  const rl = await checkRateLimit(`auth:signIn:${ip}`, 10, 60_000, {
    strict: true,
  });
  if (!rl.allowed) {
    return { error: "Trop de tentatives. Réessaie dans une minute." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    logServerError("auth.signIn", error);
    return { error: mapAuthError(error) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Connexion impossible." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (next) redirect(next);

  if (
    (profile?.role === "artist" || profile?.role === "label") &&
    !profile.onboarding_completed
  ) {
    redirect("/onboarding");
  }

  redirect(creatorHome(profile?.role || "fan"));
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || "fan",
    display_name: formData.get("display_name") || "",
    country: formData.get("country") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Données invalides." };
  }

  const { email, password, role, display_name: displayName, country } =
    parsed.data;

  // Fans : pseudo requis
  if (role === "fan" && !displayName) {
    return { error: "Pseudo, email et mot de passe requis." };
  }

  const ip = await authClientIp();
  const rl = await checkRateLimit(`auth:signUp:${ip}`, 5, 60_000, {
    strict: true,
  });
  if (!rl.allowed) {
    return { error: "Trop d'inscriptions. Réessaie dans une minute." };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        role: role as UserRole,
        display_name: displayName || null,
        country: country || null,
      },
    },
  });

  if (error) {
    logServerError("auth.signUp", error);
    return { error: mapAuthError(error) };
  }

  notifyWelcome({
    email,
    displayName: displayName || null,
    role,
  });

  async function syncProfile(userId: string) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        country: country || null,
      })
      .eq("id", userId);
    if (profileError) {
      logServerError("auth.signUp.profile", profileError);
    }
  }

  async function go(userId?: string | null) {
    if (userId) await syncProfile(userId);
    if (role === "fan") redirect("/discover");
    redirect("/onboarding");
  }

  if (data.session && data.user) {
    await go(data.user.id);
  }

  const { data: signedIn, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });
  if (!signInError) {
    await go(signedIn.user?.id ?? data.user?.id);
  }

  return {
    success: "Compte créé. Tu peux te connecter maintenant.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
