import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { artistPath, releasePath } from "@/lib/public-id";
import { siteUrl } from "@/lib/seo";

const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "hourly", priority: 1 },
  { path: "/discover/catalogue", changeFrequency: "hourly", priority: 0.9 },
  { path: "/discover/albums", changeFrequency: "daily", priority: 0.8 },
  { path: "/discover/artistes", changeFrequency: "daily", priority: 0.8 },
  { path: "/discover/hits", changeFrequency: "daily", priority: 0.8 },
  { path: "/discover/tendances", changeFrequency: "hourly", priority: 0.8 },
  { path: "/discover/sorties", changeFrequency: "daily", priority: 0.7 },
  { path: "/discover/genres", changeFrequency: "weekly", priority: 0.7 },
  { path: "/discover/nouveautes", changeFrequency: "daily", priority: 0.7 },
  { path: "/discover/decouvrir", changeFrequency: "daily", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/termes", changeFrequency: "yearly", priority: 0.3 },
  { path: "/confidentialite", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: siteUrl(p.path),
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  try {
    const supabase = createPublicClient();
    const [{ data: releases }, { data: artists }] = await Promise.all([
      supabase
        .from("releases")
        .select("public_id, updated_at, created_at")
        .eq("status", "published")
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("artists")
        .select("public_id, created_at")
        .not("public_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(2000),
    ]);

    for (const r of releases || []) {
      if (!r.public_id) continue;
      entries.push({
        url: siteUrl(releasePath(r.public_id)),
        lastModified: new Date(r.updated_at || r.created_at),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const a of artists || []) {
      if (!a.public_id) continue;
      entries.push({
        url: siteUrl(artistPath(a.public_id)),
        lastModified: new Date(a.created_at),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (e) {
    console.error("[sitemap]", e);
  }

  return entries;
}
