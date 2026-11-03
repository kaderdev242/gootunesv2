import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Évite un SELECT site_settings à chaque hit (landing, assets, etc.). */
let maintenanceCache: { value: boolean; expiresAt: number } | null = null;
const MAINTENANCE_TTL_MS = 30_000;

async function readMaintenanceEnabled(
  supabase: ReturnType<typeof createServerClient>,
): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && now < maintenanceCache.expiresAt) {
    return maintenanceCache.value;
  }

  try {
    const { data: settings } = await supabase
      .from("site_settings")
      .select("maintenance_enabled")
      .eq("id", 1)
      .maybeSingle();
    const value = Boolean(settings?.maintenance_enabled);
    maintenanceCache = { value, expiresAt: now + MAINTENANCE_TTL_MS };
    return value;
  } catch {
    maintenanceCache = { value: false, expiresAt: now + MAINTENANCE_TTL_MS };
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api");
  const isAuthPage =
    path.startsWith("/connexion") || path.startsWith("/inscription");
  const isLoginPage = path.startsWith("/connexion");
  const isAdminArea = path.startsWith("/goo-admin");
  const isMaintenancePage = path.startsWith("/maintenance");
  const isSuspendedPage = path.startsWith("/compte-suspendu");
  const isCreatorArea =
    path.startsWith("/artist") ||
    path.startsWith("/label") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/dashboard");

  // Ne jamais rediriger les routes API (sinon HTML au lieu de JSON)
  if (isApi) {
    return supabaseResponse;
  }

  const maintenanceOn = await readMaintenanceEnabled(supabase);

  // Profil léger si connecté
  let role: string | undefined;
  let onboarded = false;
  let isAdmin = false;
  let isSuspended = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed, is_admin, is_suspended")
      .eq("id", user.id)
      .maybeSingle();

    role = profile?.role;
    onboarded = Boolean(profile?.onboarding_completed);
    const emailOk = adminEmails().has((user.email || "").toLowerCase());
    isAdmin = Boolean(profile?.is_admin) || emailOk;
    isSuspended = Boolean(profile?.is_suspended) && !isAdmin;
  } else if (maintenanceOn) {
    // pendant maintenance : seul login admin + page maintenance + goo-admin
    // (goo-admin redirigera vers connexion si besoin)
  }

  const home =
    role === "artist" ? "/artist" : role === "label" ? "/label" : "/discover";

  // Maintenance globale : tout bloqué sauf /goo-admin, /connexion et /maintenance
  if (maintenanceOn && !isAdminArea && !isMaintenancePage && !isLoginPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/maintenance";
    return NextResponse.redirect(redirectUrl);
  }

  // Compte suspendu : aucun accès app (sauf page suspendu / déconnexion via auth)
  if (isSuspended) {
    if (!isSuspendedPage && !isLoginPage) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/compte-suspendu";
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (!user && (isCreatorArea || isAdminArea)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/connexion";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    if (isAdminArea && !isAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = isSuspended ? "/compte-suspendu" : home;
      return NextResponse.redirect(redirectUrl);
    }

    if (isAuthPage) {
      const redirectUrl = request.nextUrl.clone();
      if (isSuspended) {
        redirectUrl.pathname = "/compte-suspendu";
        return NextResponse.redirect(redirectUrl);
      }
      if (maintenanceOn && !isAdmin) {
        redirectUrl.pathname = "/maintenance";
        return NextResponse.redirect(redirectUrl);
      }
      if (isAdmin && maintenanceOn) {
        redirectUrl.pathname = "/goo-admin";
        return NextResponse.redirect(redirectUrl);
      }
      if ((role === "artist" || role === "label") && !onboarded) {
        redirectUrl.pathname = "/onboarding";
      } else {
        redirectUrl.pathname = home;
      }
      return NextResponse.redirect(redirectUrl);
    }

    if ((role === "artist" || role === "label") && !onboarded) {
      if (!path.startsWith("/onboarding") && !isAdminArea && !isSuspendedPage) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/onboarding";
        return NextResponse.redirect(redirectUrl);
      }
    }

    if (path.startsWith("/artist") && role === "label") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = path.replace(/^\/artist/, "/label");
      return NextResponse.redirect(redirectUrl);
    }
    if (path.startsWith("/label") && role === "artist") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = path.replace(/^\/label/, "/artist");
      return NextResponse.redirect(redirectUrl);
    }

    const isConversion =
      role === "fan" &&
      ["artist", "label"].includes(
        request.nextUrl.searchParams.get("devenir") ?? "",
      );
    if (path.startsWith("/onboarding") && onboarded && !isConversion) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = home;
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
