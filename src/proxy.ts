import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Domaine d’accès principal (app, auth, webhooks). */
const PRIMARY_HOST = "www.gootunes.com";

/** Anciens / secondaires : redirigent vers le principal (sauf R2/email hors Next). */
const REDIRECT_HOSTS = new Set([
  "gootunes.com",
  "gootunes.app",
  "www.gootunes.app",
]);

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const path = request.nextUrl.pathname;

  // Les webhooks restent acceptés sur l’ancien host (Mbiyo ne suit pas toujours les redirects).
  const isWebhook = path.startsWith("/api/webhooks");

  if (host && REDIRECT_HOSTS.has(host) && !isWebhook) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = PRIMARY_HOST;
    return NextResponse.redirect(url, 308);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
