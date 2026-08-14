"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { creatorHome } from "@/lib/dashboard/paths";
import { notifyWelcome } from "@/lib/email/notify";
import { logServerError, mapAuthError } from "@/lib/errors";
import type { UserRole } from "@/lib/supabase/database.types";

export type AuthState = {
  error?: string;
  success?: string;
};

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
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
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "fan") as UserRole;
  const displayName = String(formData.get("display_name") || "").trim();
  const country = String(formData.get("country") || "").trim();

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }
  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères." };
  }
  if (!["fan", "artist", "label"].includes(role)) {
    return { error: "Rôle invalide." };
  }

  // Fans peuvent encore envoyer un pseudo optionnel ; créateurs → onboarding
  if (role === "fan" && !displayName) {
    return { error: "Pseudo, email et mot de passe requis." };
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        role,
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
    // Le trigger crée le profil ; on force le pseudo/pays (fans surtout)
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
