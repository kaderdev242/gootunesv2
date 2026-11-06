import { createClient } from "@/lib/supabase/server";
import { isApplePaymentMethod } from "@/lib/purchases/apple-tiers";

const DAY = 86_400_000;

export type CreatorSale = {
  createdAt: string;
  net: number;
  apple: boolean;
  releaseId: string | null;
  title: string;
  cover: string | null;
};

export type CreatorTopRelease = {
  releaseId: string;
  publicId: string | null;
  title: string;
  cover: string | null;
  sales: number;
  net: number;
};

export type CreatorOverview = {
  series: { key: string; value: number }[];
  net30: number;
  netPrev30: number;
  sales30: number;
  salesPrev30: number;
  plays30: number;
  playsPrev30: number;
  totalNet: number;
  momoNet: number;
  appleNet: number;
  releasesCount: number;
  topReleases: CreatorTopRelease[];
  recentSales: CreatorSale[];
};

type ReleaseJoin = {
  id: string;
  public_id: string | null;
  title: string;
  cover_url: string | null;
} | null;

/** Données de la vue d'ensemble artiste / label (ventes, revenus, écoutes). */
export async function getCreatorOverview(userId: string): Promise<CreatorOverview> {
  const supabase = await createClient();
  const now = Date.now();
  const d30 = new Date(now - 30 * DAY).toISOString();
  const d60 = new Date(now - 60 * DAY).toISOString();

  const [purchasesRes, releasesRes, plays30Res, playsPrevRes] = await Promise.all([
    supabase
      .from("purchases")
      .select(
        "created_at, artist_net_fcfa, payment_method, release_id, releases(id, public_id, title, cover_url)",
      )
      .eq("seller_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("releases")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId),
    supabase
      .from("track_plays")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .gte("created_at", d30),
    supabase
      .from("track_plays")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .gte("created_at", d60)
      .lt("created_at", d30),
  ]);

  const sales: (CreatorSale & { publicId: string | null })[] = (
    purchasesRes.data ?? []
  ).map((p) => {
    const rel = (Array.isArray(p.releases) ? p.releases[0] : p.releases) as ReleaseJoin;
    return {
      createdAt: p.created_at,
      net: Number(p.artist_net_fcfa) || 0,
      apple: isApplePaymentMethod(p.payment_method),
      releaseId: rel?.id ?? p.release_id ?? null,
      publicId: rel?.public_id ?? null,
      title: rel?.title ?? "Sortie",
      cover: rel?.cover_url ?? null,
    };
  });

  // Série journalière des 30 derniers jours (revenus nets).
  const byDay = new Map<string, number>();
  for (const s of sales) {
    const key = s.createdAt.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + s.net);
  }
  const series = Array.from({ length: 30 }, (_, i) => {
    const key = new Date(now - (29 - i) * DAY).toISOString().slice(0, 10);
    return { key, value: byDay.get(key) ?? 0 };
  });

  const t30 = now - 30 * DAY;
  const t60 = now - 60 * DAY;
  let net30 = 0;
  let netPrev30 = 0;
  let sales30 = 0;
  let salesPrev30 = 0;
  let momoNet = 0;
  let appleNet = 0;
  const top = new Map<string, CreatorTopRelease>();

  for (const s of sales) {
    const t = new Date(s.createdAt).getTime();
    if (t >= t30) {
      net30 += s.net;
      sales30 += 1;
    } else if (t >= t60) {
      netPrev30 += s.net;
      salesPrev30 += 1;
    }
    if (s.apple) appleNet += s.net;
    else momoNet += s.net;
    if (s.releaseId) {
      const row = top.get(s.releaseId) ?? {
        releaseId: s.releaseId,
        publicId: s.publicId,
        title: s.title,
        cover: s.cover,
        sales: 0,
        net: 0,
      };
      row.sales += 1;
      row.net += s.net;
      top.set(s.releaseId, row);
    }
  }

  return {
    series,
    net30,
    netPrev30,
    sales30,
    salesPrev30,
    plays30: plays30Res.count ?? 0,
    playsPrev30: playsPrevRes.count ?? 0,
    totalNet: momoNet + appleNet,
    momoNet,
    appleNet,
    releasesCount: releasesRes.count ?? 0,
    topReleases: [...top.values()].sort((a, b) => b.net - a.net).slice(0, 5),
    recentSales: sales.slice(0, 6),
  };
}

/** Variation en % entre deux périodes (null si pas de base de comparaison). */
export function changePct(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}
