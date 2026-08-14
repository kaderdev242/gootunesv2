import { createAdminClient } from "@/lib/supabase/admin";
import { COUNTRIES } from "@/lib/constants";
import type {
  PaymentStatus,
  ReportStatus,
  UserRole,
} from "@/lib/supabase/database.types";

function countryLabel(code: string | null | undefined) {
  if (!code) return "Non renseigné";
  return COUNTRIES.find((c) => c.code === code)?.label || code;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? v[0] || null : v;
}

export async function getAdminOverview() {
  const db = createAdminClient();

  const [
    fans,
    artists,
    labels,
    releases,
    published,
    hidden,
    purchases,
    completedPurchases,
    withdrawals,
    openReports,
    plays,
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "fan"),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "artist"),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "label"),
    db.from("releases").select("id", { count: "exact", head: true }),
    db
      .from("releases")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    db
      .from("releases")
      .select("id", { count: "exact", head: true })
      .eq("is_hidden", true),
    db.from("purchases").select("id", { count: "exact", head: true }),
    db
      .from("purchases")
      .select("amount_fcfa, commission_fcfa")
      .eq("status", "completed"),
    db.from("withdrawals").select("id", { count: "exact", head: true }),
    db
      .from("track_reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "reviewing"]),
    db.from("track_plays").select("id", { count: "exact", head: true }),
  ]);

  const gmv = (completedPurchases.data || []).reduce(
    (s, p) => s + (p.amount_fcfa || 0),
    0,
  );
  const commission = (completedPurchases.data || []).reduce(
    (s, p) => s + (p.commission_fcfa || 0),
    0,
  );

  return {
    fans: fans.count || 0,
    artists: artists.count || 0,
    labels: labels.count || 0,
    releases: releases.count || 0,
    published: published.count || 0,
    hidden: hidden.count || 0,
    purchases: purchases.count || 0,
    withdrawals: withdrawals.count || 0,
    openReports: openReports.count || 0,
    plays: plays.count || 0,
    gmv,
    commission,
    completedSales: completedPurchases.data?.length || 0,
  };
}

/** Dashboard Vue d'ensemble — layout dense, peu de cartes */
export async function getAdminDashboard() {
  const db = createAdminClient();
  const now = new Date();
  const todayStart = startOfDay(now);
  const d7 = daysAgo(6);
  const d30 = daysAgo(29);
  const d60 = daysAgo(59);

  const [
    profilesCount,
    newToday,
    profilesPrev,
    profilesCurr,
    completedSales,
    labelOrders,
    openReports,
    recentUsers,
    popularReleases,
    recentReports,
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", d60.toISOString())
      .lt("created_at", d30.toISOString()),
    db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", d30.toISOString()),
    db
      .from("purchases")
      .select("amount_fcfa, commission_fcfa, created_at, release_id, status")
      .eq("status", "completed")
      .gte("created_at", d60.toISOString())
      .order("created_at", { ascending: true })
      .limit(2000),
    db
      .from("label_plan_orders")
      .select("amount_fcfa, created_at, status")
      .eq("status", "completed")
      .gte("created_at", d60.toISOString())
      .limit(1000),
    db
      .from("track_reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "reviewing"]),
    db
      .from("profiles")
      .select("id, display_name, avatar_url, role, country, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("releases")
      .select(
        "id, public_id, title, cover_url, price_fcfa, status, type, artists(stage_name)",
      )
      .eq("status", "published")
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("track_reports")
      .select(
        "id, reason, details, status, created_at, profiles!track_reports_reporter_id_fkey(display_name, avatar_url), tracks(title)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const sales = completedSales.data || [];
  const labels = labelOrders.data || [];

  const inRange = (iso: string, from: Date, to?: Date) => {
    const t = new Date(iso).getTime();
    if (t < from.getTime()) return false;
    if (to && t >= to.getTime()) return false;
    return true;
  };

  const salesCurr = sales.filter((p) => inRange(p.created_at, d30));
  const salesPrev = sales.filter((p) => inRange(p.created_at, d60, d30));
  const gmvCurr = salesCurr.reduce((s, p) => s + (p.amount_fcfa || 0), 0);
  const gmvPrev = salesPrev.reduce((s, p) => s + (p.amount_fcfa || 0), 0);
  const labelGmvCurr = labels
    .filter((o) => inRange(o.created_at, d30))
    .reduce((s, o) => s + (o.amount_fcfa || 0), 0);
  const commissionCurr = salesCurr.reduce(
    (s, p) => s + (p.commission_fcfa || 0),
    0,
  );

  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const salesByDay = dayKeys.map((key) => {
    const amount = sales
      .filter((p) => p.created_at.slice(0, 10) === key)
      .reduce((s, p) => s + (p.amount_fcfa || 0), 0);
    const labelAmount = labels
      .filter((o) => o.created_at.slice(0, 10) === key)
      .reduce((s, o) => s + (o.amount_fcfa || 0), 0);
    return {
      key,
      label: new Date(key).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
      }),
      amount: amount + labelAmount,
    };
  });
  const weekTotal = salesByDay.reduce((s, d) => s + d.amount, 0);

  return {
    usersTotal: profilesCount.count || 0,
    usersToday: newToday.count || 0,
    usersChangePct: pctChange(profilesCurr.count || 0, profilesPrev.count || 0),
    gmv30d: gmvCurr + labelGmvCurr,
    gmvChangePct: pctChange(gmvCurr + labelGmvCurr, gmvPrev),
    commission30d: commissionCurr,
    openReports: openReports.count || 0,
    weekTotal,
    salesByDay,
    recentUsers: (recentUsers.data || []).map((u) => ({
      id: u.id,
      name: u.display_name || "Sans nom",
      avatar: u.avatar_url,
      role: u.role,
      country: u.country,
      countryLabel: countryLabel(u.country),
    })),
    popularReleases: (popularReleases.data || []).map((r) => {
      const artist = one(
        r.artists as { stage_name: string } | { stage_name: string }[] | null,
      );
      return {
        id: r.public_id,
        title: r.title,
        cover: r.cover_url,
        price: r.price_fcfa,
        type: r.type,
        status: r.status,
        artist: artist?.stage_name || "—",
      };
    }),
    recentReports: (recentReports.data || []).map((r) => {
      const reporter = one(
        r.profiles as
          | { display_name: string | null; avatar_url: string | null }
          | { display_name: string | null; avatar_url: string | null }[]
          | null,
      );
      const track = one(
        r.tracks as { title: string } | { title: string }[] | null,
      );
      return {
        id: r.id,
        reason: r.reason,
        details: r.details,
        status: r.status,
        createdAt: r.created_at,
        reporterName: reporter?.display_name || "Anonyme",
        reporterAvatar: reporter?.avatar_url || null,
        trackTitle: track?.title || "Morceau",
      };
    }),
  };
}

/** Stats avancées : pays, périodes, mix produits */
export async function getAdminAnalytics() {
  const db = createAdminClient();
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = daysAgo(6);
  const monthStart = daysAgo(29);
  const chartStart = daysAgo(13);

  const [
    profiles,
    purchases,
    labelOrders,
    fans,
    artists,
    labels,
    plays,
  ] = await Promise.all([
    db.from("profiles").select("id, country, role, created_at").limit(5000),
    db
      .from("purchases")
      .select(
        "id, amount_fcfa, commission_fcfa, status, created_at, release_id, buyer_id, releases(title, type, cover_url), buyer:profiles!purchases_buyer_id_fkey(country, display_name)",
      )
      .order("created_at", { ascending: false })
      .limit(3000),
    db
      .from("label_plan_orders")
      .select(
        "id, amount_fcfa, plan, status, created_at, user_id, profiles(country, display_name)",
      )
      .order("created_at", { ascending: false })
      .limit(1000),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "fan"),
    db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "artist"),
    db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "label"),
    db.from("track_plays").select("id", { count: "exact", head: true }),
  ]);

  const allProfiles = profiles.data || [];
  const allPurchases = purchases.data || [];
  const allLabels = labelOrders.data || [];
  const completedMusic = allPurchases.filter((p) => p.status === "completed");
  const completedLabels = allLabels.filter((o) => o.status === "completed");

  // Users by country
  const usersByCountryMap = new Map<string, number>();
  for (const p of allProfiles) {
    const key = p.country || "—";
    usersByCountryMap.set(key, (usersByCountryMap.get(key) || 0) + 1);
  }
  const usersByCountry = [...usersByCountryMap.entries()]
    .map(([country, count]) => ({
      country,
      label: countryLabel(country === "—" ? null : country),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Buyers by country (music + label)
  const buyMap = new Map<string, { count: number; amount: number }>();
  for (const p of completedMusic) {
    const buyer = one(
      p.buyer as { country: string | null } | { country: string | null }[] | null,
    );
    const key = buyer?.country || "—";
    const cur = buyMap.get(key) || { count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += p.amount_fcfa || 0;
    buyMap.set(key, cur);
  }
  for (const o of completedLabels) {
    const profile = one(
      o.profiles as
        | { country: string | null }
        | { country: string | null }[]
        | null,
    );
    const key = profile?.country || "—";
    const cur = buyMap.get(key) || { count: 0, amount: 0 };
    cur.count += 1;
    cur.amount += o.amount_fcfa || 0;
    buyMap.set(key, cur);
  }
  const buyersByCountry = [...buyMap.entries()]
    .map(([country, v]) => ({
      country,
      label: countryLabel(country === "—" ? null : country),
      count: v.count,
      amount: v.amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const sumIn = (
    rows: { created_at: string; amount_fcfa: number }[],
    from: Date,
  ) => {
    const filtered = rows.filter(
      (r) => new Date(r.created_at).getTime() >= from.getTime(),
    );
    return {
      count: filtered.length,
      amount: filtered.reduce((s, r) => s + (r.amount_fcfa || 0), 0),
    };
  };

  const musicToday = sumIn(completedMusic, todayStart);
  const musicWeek = sumIn(completedMusic, weekStart);
  const musicMonth = sumIn(completedMusic, monthStart);
  const labelToday = sumIn(completedLabels, todayStart);
  const labelWeek = sumIn(completedLabels, weekStart);
  const labelMonth = sumIn(completedLabels, monthStart);

  const periods = {
    day: {
      musicCount: musicToday.count,
      musicAmount: musicToday.amount,
      labelCount: labelToday.count,
      labelAmount: labelToday.amount,
      totalCount: musicToday.count + labelToday.count,
      totalAmount: musicToday.amount + labelToday.amount,
    },
    week: {
      musicCount: musicWeek.count,
      musicAmount: musicWeek.amount,
      labelCount: labelWeek.count,
      labelAmount: labelWeek.amount,
      totalCount: musicWeek.count + labelWeek.count,
      totalAmount: musicWeek.amount + labelWeek.amount,
    },
    month: {
      musicCount: musicMonth.count,
      musicAmount: musicMonth.amount,
      labelCount: labelMonth.count,
      labelAmount: labelMonth.amount,
      totalCount: musicMonth.count + labelMonth.count,
      totalAmount: musicMonth.amount + labelMonth.amount,
    },
  };

  const productMix = {
    musicCount: completedMusic.length,
    musicAmount: completedMusic.reduce((s, p) => s + (p.amount_fcfa || 0), 0),
    labelCount: completedLabels.length,
    labelAmount: completedLabels.reduce((s, o) => s + (o.amount_fcfa || 0), 0),
    labelPlans: {
      starter: completedLabels.filter((o) => o.plan === "starter").length,
      unlimited: completedLabels.filter((o) => o.plan === "unlimited").length,
    },
  };

  // Daily chart 14 days
  const chartKeys: string[] = [];
  for (let i = 13; i >= 0; i--) {
    chartKeys.push(daysAgo(i).toISOString().slice(0, 10));
  }
  const dailySales = chartKeys.map((key) => {
    const music = completedMusic
      .filter((p) => p.created_at.slice(0, 10) === key)
      .reduce((s, p) => s + (p.amount_fcfa || 0), 0);
    const subscriptions = completedLabels
      .filter((o) => o.created_at.slice(0, 10) === key)
      .reduce((s, o) => s + (o.amount_fcfa || 0), 0);
    return {
      key,
      dayLabel: new Date(key).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      }),
      music,
      subscriptions,
      total: music + subscriptions,
    };
  });

  // Top releases by sales
  const releaseMap = new Map<
    string,
    {
      title: string;
      type: string;
      cover: string | null;
      count: number;
      amount: number;
    }
  >();
  for (const p of completedMusic) {
    const release = one(
      p.releases as
        | { title: string; type: string; cover_url: string | null }
        | { title: string; type: string; cover_url: string | null }[]
        | null,
    );
    const id = p.release_id;
    if (!id) continue;
    const cur = releaseMap.get(id) || {
      title: release?.title || "—",
      type: release?.type || "single",
      cover: release?.cover_url || null,
      count: 0,
      amount: 0,
    };
    cur.count += 1;
    cur.amount += p.amount_fcfa || 0;
    releaseMap.set(id, cur);
  }
  const topReleases = [...releaseMap.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const commissionMonth = completedMusic
    .filter((p) => new Date(p.created_at).getTime() >= monthStart.getTime())
    .reduce((s, p) => s + (p.commission_fcfa || 0), 0);

  return {
    totals: {
      fans: fans.count || 0,
      artists: artists.count || 0,
      labels: labels.count || 0,
      plays: plays.count || 0,
      users: allProfiles.length,
      commissionMonth,
    },
    usersByCountry,
    buyersByCountry,
    periods,
    productMix,
    dailySales,
    topReleases,
  };
}

export async function listProfilesByRole(role: UserRole, limit = 80) {
  const db = createAdminClient();
  const { data } = await db
    .from("profiles")
    .select(
      "id, email, display_name, avatar_url, role, country, phone, balance_fcfa, is_admin, is_suspended, created_at, onboarding_completed, label_plan",
    )
    .eq("role", role)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function listReleasesAdmin(limit = 80) {
  const db = createAdminClient();
  const { data } = await db
    .from("releases")
    .select(
      "id, public_id, title, type, status, price_fcfa, genre, cover_url, is_hidden, created_at, artists(stage_name), profiles!releases_owner_id_fkey(display_name, email)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function listPurchasesAdmin(limit = 80) {
  const db = createAdminClient();
  const { data } = await db
    .from("purchases")
    .select(
      "id, amount_fcfa, commission_fcfa, artist_net_fcfa, payment_method, status, provider, order_id, payer_phone, created_at, releases(title), buyer:profiles!purchases_buyer_id_fkey(display_name, email), seller:profiles!purchases_seller_id_fkey(display_name, email)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function listWithdrawalsAdmin(limit = 80) {
  const db = createAdminClient();
  const { data } = await db
    .from("withdrawals")
    .select(
      "id, amount_fcfa, payment_method, phone, status, provider, order_id, created_at, profiles(display_name, email)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function listReportsAdmin(
  status?: ReportStatus | "all",
  limit = 80,
) {
  const db = createAdminClient();
  let q = db
    .from("track_reports")
    .select(
      "id, reason, details, status, admin_note, created_at, resolved_at, tracks(id, title, release_id, releases(id, title, is_hidden, cover_url)), profiles!track_reports_reporter_id_fkey(display_name, email)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") {
    q = q.eq("status", status);
  }

  const { data } = await q;
  return data || [];
}

export async function getSiteSettings() {
  const db = createAdminClient();
  const { data } = await db
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return (
    data || {
      id: 1,
      maintenance_enabled: false,
      maintenance_message: "Gootunes est en maintenance. Reviens bientôt.",
      updated_at: new Date().toISOString(),
      updated_by: null,
    }
  );
}

export type AdminHitRow = {
  id: string;
  trackId: string;
  releaseId: string;
  coverUrl: string | null;
  position: number;
  isPublished: boolean;
  /** Titre affiché (éditorial ou titre du morceau) */
  title: string;
  /** Titre original du morceau en catalogue */
  trackTitle: string;
  artistName: string;
  releaseCover: string | null;
  releaseTitle: string;
  salesCount: number;
  createdAt: string;
};

export type CatalogHitCandidate = {
  trackId: string;
  releaseId: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  releaseTitle: string;
  genre: string | null;
  salesCount: number;
  alreadyInHits: boolean;
};

async function salesByRelease(): Promise<Map<string, number>> {
  const db = createAdminClient();
  const { data } = await db
    .from("purchases")
    .select("release_id")
    .eq("status", "completed");
  const map = new Map<string, number>();
  for (const row of data || []) {
    if (!row.release_id) continue;
    map.set(row.release_id, (map.get(row.release_id) || 0) + 1);
  }
  return map;
}

export async function listEditorialHitsAdmin(): Promise<AdminHitRow[]> {
  const db = createAdminClient();
  const [{ data }, sales] = await Promise.all([
    db
      .from("editorial_hits")
      .select(
        "id, track_id, release_id, title, cover_url, position, is_published, created_at, tracks(title), releases(title, cover_url, artists(stage_name))",
      )
      .order("position", { ascending: true }),
    salesByRelease(),
  ]);

  return (data || []).map((row) => {
    const track = Array.isArray(row.tracks) ? row.tracks[0] : row.tracks;
    const release = Array.isArray(row.releases) ? row.releases[0] : row.releases;
    const artist = release?.artists
      ? Array.isArray(release.artists)
        ? release.artists[0]
        : release.artists
      : null;
    const trackTitle =
      (track as { title?: string } | null)?.title || "Sans titre";
    return {
      id: row.id,
      trackId: row.track_id,
      releaseId: row.release_id,
      coverUrl: row.cover_url,
      position: row.position,
      isPublished: row.is_published,
      title: (row.title || "").trim() || trackTitle,
      trackTitle,
      artistName:
        (artist as { stage_name?: string } | null)?.stage_name || "Artiste",
      releaseCover:
        (release as { cover_url?: string | null } | null)?.cover_url || null,
      releaseTitle:
        (release as { title?: string } | null)?.title || "Release",
      salesCount: sales.get(row.release_id) || 0,
      createdAt: row.created_at,
    };
  });
}

/** Catalogue pour ajouter un hit — plus vendus en premier, recherche optionnelle. */
export async function searchCatalogForHits(
  query = "",
  limit = 40,
): Promise<CatalogHitCandidate[]> {
  const db = createAdminClient();
  const q = query.trim().toLowerCase();

  const [{ data: tracks }, sales, { data: existing }] = await Promise.all([
    db
      .from("tracks")
      .select(
        "id, title, release_id, releases!inner(id, title, cover_url, genre, status, is_hidden, artists(stage_name))",
      )
      .eq("releases.status", "published")
      .eq("releases.is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(200),
    salesByRelease(),
    db.from("editorial_hits").select("track_id"),
  ]);

  const inHits = new Set((existing || []).map((h) => h.track_id));

  const rows: CatalogHitCandidate[] = (tracks || []).map((t) => {
    const release = Array.isArray(t.releases) ? t.releases[0] : t.releases;
    const artist = release?.artists
      ? Array.isArray(release.artists)
        ? release.artists[0]
        : release.artists
      : null;
    return {
      trackId: t.id,
      releaseId: t.release_id,
      title: t.title,
      artistName:
        (artist as { stage_name?: string } | null)?.stage_name || "Artiste",
      coverUrl:
        (release as { cover_url?: string | null } | null)?.cover_url || null,
      releaseTitle: (release as { title?: string } | null)?.title || t.title,
      genre: (release as { genre?: string | null } | null)?.genre || null,
      salesCount: sales.get(t.release_id) || 0,
      alreadyInHits: inHits.has(t.id),
    };
  });

  const filtered = q
    ? rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.artistName.toLowerCase().includes(q) ||
          r.releaseTitle.toLowerCase().includes(q) ||
          (r.genre || "").toLowerCase().includes(q),
      )
    : rows;

  return filtered
    .sort(
      (a, b) =>
        Number(a.alreadyInHits) - Number(b.alreadyInHits) ||
        b.salesCount - a.salesCount ||
        a.title.localeCompare(b.title),
    )
    .slice(0, limit);
}

export type PaymentRowStatus = PaymentStatus;
