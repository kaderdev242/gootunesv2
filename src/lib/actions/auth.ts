"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

/** Garde seulement un chemin interne (« /… »), jamais une autre origine. */
function safeNext(value: unknown): string {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return "";
  return v;
}

async function authClientIp() {
  const h = await headers();
  return clientIpFromHeaders(h);
}

/**
 * Première étape du parcours : l'e-mail a-t-il déjà un compte ?
 * Limité par IP pour qu'on ne puisse pas sonder la liste des inscrits.
 */
export async function lookupAuthEmail(
  email: string,
): Promise<{ status: "existing" | "new" } | { error: string }> {
  const value = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254) {
    return { error: "Adresse e-mail invalide." };
  }
  const ip = await authClientIp();
  const rl = await checkRateLimit(`auth:lookup:${ip}`, 10, 60_000, { strict: true });
  if (!rl.allowed) {
    return { error: "Trop de tentatives. Réessaie dans une minute." };
  }
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("email", value)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return { status: data ? "existing" : "new" };
  } catch (err) {
    logServerError("auth.lookupEmail", err);
    return { error: "Vérification impossible. Réessaie." };
  }
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

  const target = safeNext(next);
  if (target) redirect(target);

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
    if (role === "fan") redirect(safeNext(formData.get("next")) || "/discover");
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
