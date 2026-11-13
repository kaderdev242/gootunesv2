import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/errors";

import type { RetroPeriod } from "@/lib/retro-periods";

export type { RetroPeriod };
export { RETRO_PERIODS, parsePeriod } from "@/lib/retro-periods";

export type RetroTrack = { title: string; releaseTitle: string; cover: string | null; plays: number };
export type RetroArtist = { name: string; avatar: string | null; plays: number };
export type RetroCountry = { country: string; plays: number };

export type RetroData = {
  period: RetroPeriod;
  periodLabel: string;
  plays: number;
  playsPrev: number | null;
  listeners: number;
  countriesCount: number;
  topTracks: RetroTrack[];
  topCountries: RetroCountry[];
  topArtists: RetroArtist[];
  peakDow: number | null;
  peakHour: number | null;
  bestDay: { date: string; plays: number } | null;
  sales: number;
  net: number;
  topRelease: { title: string; cover: string | null; sales: number } | null;
  totalNet: number;
  totalPlays: number;
  newFollowers: number;
  favorites: number;
  releases: number;
};

function range(period: RetroPeriod, now = new Date()) {
  const end = now;
  if (period === "mois") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const label = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    return { start, end, label };
  }
  if (period === "tout") {
    return { start: new Date(Date.UTC(2020, 0, 1)), end, label: "Depuis le début" };
  }
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  return { start, end, label: String(now.getUTCFullYear()) };
}

const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
const str = (v: unknown) => (typeof v === "string" ? v : null);
const arr = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

export async function getCreatorRetro(period: RetroPeriod): Promise<RetroData | null> {
  const { start, end, label } = range(period);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_creator_retro", {
    p_start: start.toISOString(),
    p_end: end.toISOString(),
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    if (error) logServerError("retro.load", error);
    return null;
  }
  const d = data as Record<string, unknown>;
  const best = d.best_day as Record<string, unknown> | null;
  const topRelease = d.top_release as Record<string, unknown> | null;

  return {
    period,
    periodLabel: label,
    plays: num(d.plays),
    playsPrev: period === "tout" ? null : num(d.plays_prev),
    listeners: num(d.listeners),
    countriesCount: num(d.countries_count),
    topTracks: arr(d.top_tracks).map((t) => ({
      title: str(t.title) ?? "",
      releaseTitle: str(t.release_title) ?? "",
      cover: str(t.cover),
      plays: num(t.plays),
    })),
    topCountries: arr(d.top_countries).map((c) => ({ country: str(c.country) ?? "", plays: num(c.plays) })),
    topArtists: arr(d.top_artists).map((a) => ({
      name: str(a.name) ?? "",
      avatar: str(a.avatar),
      plays: num(a.plays),
    })),
    peakDow: d.peak_dow == null ? null : num(d.peak_dow),
    peakHour: d.peak_hour == null ? null : num(d.peak_hour),
    bestDay: best ? { date: str(best.date) ?? "", plays: num(best.plays) } : null,
    sales: num(d.sales),
    net: num(d.net),
    topRelease: topRelease
      ? { title: str(topRelease.title) ?? "", cover: str(topRelease.cover), sales: num(topRelease.sales) }
      : null,
    totalNet: num(d.total_net),
    totalPlays: num(d.total_plays),
    newFollowers: num(d.new_followers),
    favorites: num(d.favorites),
    releases: num(d.releases),
  };
}
