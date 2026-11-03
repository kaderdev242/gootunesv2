import type { Metadata } from "next";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.gootunes.com";

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

const DEFAULT_OG = absoluteMediaUrl("/logo-gootunes.png");

/** Metadata liste Discover (title ~50-60, description ~140-160). */
export function listPageMetadata(input: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = siteUrl(input.path);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${input.title} · Gootunes`,
      description: input.description,
      url,
      type: "website",
      siteName: "Gootunes",
      locale: "fr_FR",
      images: [{ url: DEFAULT_OG, alt: "Gootunes" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} · Gootunes`,
      description: input.description,
      images: [DEFAULT_OG],
    },
  };
}

export const NOINDEX: Metadata = {
  robots: { index: false, follow: false },
};

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Gootunes",
    url: siteUrl(),
    logo: absoluteMediaUrl("/logo-gootunes.png"),
    sameAs: [] as string[],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "contact@gootunes.com",
      availableLanguage: ["French"],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Gootunes",
    url: siteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl("/discover/decouvrir")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
