import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/discover";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.role === "artist" || profile?.role === "label") {
          const dest = profile.onboarding_completed
            ? profile.role === "label"
              ? "/label"
              : "/artist"
            : "/onboarding";
          return NextResponse.redirect(`${origin}${dest}`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/connexion?error=auth`);
}
