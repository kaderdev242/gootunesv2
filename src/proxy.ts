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

  // Les routes API répondent sur tous les domaines, sans redirection :
  // Mbiyo (webhooks) et les applis mobiles ne suivent pas une redirection
  // 308 sur un POST (ex. ancienne URL www.gootunes.app dans l'appli fan).
  const isApi = path.startsWith("/api/");

  if (host && REDIRECT_HOSTS.has(host) && !isApi) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = PRIMARY_HOST;
    // Derrière un reverse proxy (Traefik), nextUrl garde le port interne (3000).
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  // Lecture audio : la route vérifie elle-même l'accès (JWT vérifié localement).
  // Inutile de rafraîchir la session ici — un aller-retour Supabase de moins
  // pour chaque démarrage de morceau et chaque bloc audio.
  if (path.startsWith("/api/stream/")) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
