import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/**
 * Ne pas lister /goo-admin ici — protection via auth + robots noindex sur le layout.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/artist/",
          "/label/",
          "/onboarding",
          "/dashboard",
          "/compte-suspendu",
          "/maintenance",
          "/discover/bibliotheque",
          "/discover/favoris",
          "/discover/playlists",
          "/discover/recherche",
        ],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
