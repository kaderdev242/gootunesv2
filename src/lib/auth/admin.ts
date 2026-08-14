import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/supabase/database.types";

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isEmailAdmin(email: string | null | undefined) {
  if (!email) return false;
  return adminEmails().has(email.trim().toLowerCase());
}

/** Session admin : flag DB et/ou email bootstrap ADMIN_EMAILS */
export async function requireAdmin(): Promise<{
  userId: string;
  email: string;
  profile: Profile;
} | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) return null;

    const emailOk = isEmailAdmin(user.email);
    if (!profile.is_admin && !emailOk) return null;

    // Bootstrap : pose is_admin si email listé
    if (!profile.is_admin && emailOk) {
      const admin = createAdminClient();
      const { data: updated } = await admin
        .from("profiles")
        .update({ is_admin: true })
        .eq("id", user.id)
        .select("*")
        .maybeSingle();
      if (updated) {
        return { userId: user.id, email: user.email, profile: updated };
      }
    }

    return { userId: user.id, email: user.email, profile };
  } catch {
    return null;
  }
}
