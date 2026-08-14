const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.gootunes.app";

export function siteUrl(path = "") {
  if (!path) return SITE;
  return `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** URL absolue pour Open Graph / Twitter (couverture, avatar…). */
export function absoluteMediaUrl(
  url: string | null | undefined,
  fallbackPath = "/logo-gootunes.png",
) {
  if (!url || !url.trim()) return siteUrl(fallbackPath);
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return siteUrl(url.startsWith("/") ? url : `/${url}`);
}
