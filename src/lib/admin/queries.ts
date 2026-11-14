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

/** Dashboard Vue d'ensemble — finances séparées + activité */
export async function getAdminDashboard() {
  const db = createAdminClient();
  const now = new Date();
  const todayStart = startOfDay(now);
  const d30 = daysAgo(29);
  const d60 = daysAgo(59);

  const [
    profilesCount,
    newToday,
    profilesPrev,
    profilesCurr,
    completedSales,
    labelOrders,
    artistOrders,
    withdrawals,
    withdrawalsPendingCount,
    withdrawalsPendingAmounts,
    openReports,
    recentUsers,
    popularReleases,
    recentPurchases,
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
      .select(
        "amount_fcfa, commission_fcfa, artist_net_fcfa, created_at, release_id, status",
      )
      .eq("status", "completed")
      .gte("created_at", d60.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
    db
      .from("label_plan_orders")
      .select("amount_fcfa, created_at, status")
      .eq("status", "completed")
      .gte("created_at", d60.toISOString())
      .order("created_at", { ascending: false })
      .limit(2000),
    db
      .from("artist_plan_orders")
      .select("amount_fcfa, created_at, status")
      .eq("status", "completed")
      .gte("created_at", d60.toISOString())
      .order("created_at", { ascending: false })
      .limit(2000),
    db
      .from("withdrawals")
      .select(
        "id, amount_fcfa, status, created_at, phone, profiles!withdrawals_profile_id_fkey(display_name, email)",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("withdrawals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("withdrawals")
      .select("amount_fcfa")
      .eq("status", "pending")
      .limit(2000),
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
      .from("purchases")
      .select(
        "id, amount_fcfa, commission_fcfa, artist_net_fcfa, status, created_at, order_id, releases(title), buyer:profiles!purchases_buyer_id_fkey(display_name)",
      )
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const sales = completedSales.data || [];
  const labels = labelOrders.data || [];
  const artistsAbo = artistOrders.data || [];
  const withdrawRows = withdrawals.data || [];

  const inRange = (iso: string, from: Date, to?: Date) => {
    const t = new Date(iso).getTime();
    if (t < from.getTime()) return false;
    if (to && t >= to.getTime()) return false;
    return true;
  };

  const salesCurr = sales.filter((p) => inRange(p.created_at, d30));
  const salesPrev = sales.filter((p) => inRange(p.created_at, d60, d30));
  const musicGmvCurr = salesCurr.reduce((s, p) => s + (p.amount_fcfa || 0), 0);
  const musicGmvPrev = salesPrev.reduce((s, p) => s + (p.amount_fcfa || 0), 0);
  const artistNetCurr = salesCurr.reduce(
    (s, p) => s + (p.artist_net_fcfa || 0),
    0,
  );
  const artistNetPrev = salesPrev.reduce(
    (s, p) => s + (p.artist_net_fcfa || 0),
    0,
  );
  const commissionCurr = salesCurr.reduce(
    (s, p) => s + (p.commission_fcfa || 0),
    0,
  );
  const commissionPrev = salesPrev.reduce(
    (s, p) => s + (p.commission_fcfa || 0),
    0,
  );

  const labelAboCurr = labels
    .filter((o) => inRange(o.created_at, d30))
    .reduce((s, o) => s + (o.amount_fcfa || 0), 0);
  const labelAboPrev = labels
    .filter((o) => inRange(o.created_at, d60, d30))
    .reduce((s, o) => s + (o.amount_fcfa || 0), 0);
  const artistAboCurr = artistsAbo
    .filter((o) => inRange(o.created_at, d30))
    .reduce((s, o) => s + (o.amount_fcfa || 0), 0);
  const artistAboPrev = artistsAbo
    .filter((o) => inRange(o.created_at, d60, d30))
    .reduce((s, o) => s + (o.amount_fcfa || 0), 0);
  const subscriptionsCurr = labelAboCurr + artistAboCurr;
  const subscriptionsPrev = labelAboPrev + artistAboPrev;

  const platformRevenueCurr = commissionCurr + subscriptionsCurr;
  const platformRevenuePrev = commissionPrev + subscriptionsPrev;

  const pendingWithdrawals = withdrawRows;
  const pendingWithdrawalsFcfa = (withdrawalsPendingAmounts.data || []).reduce(
    (s, w) => s + (w.amount_fcfa || 0),
    0,
  );

  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const salesByDay = dayKeys.map((key) => {
    const music = sales
      .filter((p) => p.created_at.slice(0, 10) === key)
      .reduce((s, p) => s + (p.amount_fcfa || 0), 0);
    const abo =
      labels
        .filter((o) => o.created_at.slice(0, 10) === key)
        .reduce((s, o) => s + (o.amount_fcfa || 0), 0) +
      artistsAbo
        .filter((o) => o.created_at.slice(0, 10) === key)
        .reduce((s, o) => s + (o.amount_fcfa || 0), 0);
    return {
      key,
      label: new Date(key).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
      }),
      amount: music + abo,
      music,
      subscriptions: abo,
    };
  });
  const weekTotal = salesByDay.reduce((s, d) => s + d.amount, 0);

  // Série 30 jours (graphique principal de la vue d'ensemble).
  const salesByDay30 = Array.from({ length: 30 }, (_, idx) => {
    const key = daysAgo(29 - idx).toISOString().slice(0, 10);
    const music = sales
      .filter((p) => p.created_at.slice(0, 10) === key)
      .reduce((sum, p) => sum + (p.amount_fcfa || 0), 0);
    const abo =
      labels
        .filter((o) => o.created_at.slice(0, 10) === key)
        .reduce((sum, o) => sum + (o.amount_fcfa || 0), 0) +
      artistsAbo
        .filter((o) => o.created_at.slice(0, 10) === key)
        .reduce((sum, o) => sum + (o.amount_fcfa || 0), 0);
    return { key, amount: music + abo, music, subscriptions: abo };
  });

  // Segments exclusifs : net artistes + commission + abonnements
  const collectionTotal =
    artistNetCurr + commissionCurr + subscriptionsCurr || 1;
  const collectionMix = {
    music: musicGmvCurr,
    artistNet: artistNetCurr,
    commission: commissionCurr,
    subscriptions: subscriptionsCurr,
    total: artistNetCurr + commissionCurr + subscriptionsCurr,
    artistNetPct: Math.round((artistNetCurr / collectionTotal) * 1000) / 10,
    commissionPct: Math.round((commissionCurr / collectionTotal) * 1000) / 10,
    subscriptionsPct:
      Math.round((subscriptionsCurr / collectionTotal) * 1000) / 10,
  };

  return {
    usersTotal: profilesCount.count || 0,
    usersToday: newToday.count || 0,
    usersChangePct: pctChange(profilesCurr.count || 0, profilesPrev.count || 0),
    // Finances 30j séparées
    musicGmv30d: musicGmvCurr,
    musicGmvChangePct: pctChange(musicGmvCurr, musicGmvPrev),
    artistNet30d: artistNetCurr,
    artistNetChangePct: pctChange(artistNetCurr, artistNetPrev),
    commission30d: commissionCurr,
    commissionChangePct: pctChange(commissionCurr, commissionPrev),
    subscriptions30d: subscriptionsCurr,
    subscriptionsChangePct: pctChange(subscriptionsCurr, subscriptionsPrev),
    platformRevenue30d: platformRevenueCurr,
    platformRevenueChangePct: pctChange(
      platformRevenueCurr,
      platformRevenuePrev,
    ),
    // Compat anciennes clés
    gmv30d: musicGmvCurr + subscriptionsCurr,
    gmvChangePct: pctChange(
      musicGmvCurr + subscriptionsCurr,
      musicGmvPrev + subscriptionsPrev,
    ),
    pendingWithdrawalsFcfa,
    pendingWithdrawalsCount:
      withdrawalsPendingCount.count ?? pendingWithdrawals.length,
    pendingWithdrawals: pendingWithdrawals.slice(0, 5).map((w) => {
      const profile = one(
        w.profiles as
          | { display_name: string | null; email: string | null }
          | { display_name: string | null; email: string | null }[]
          | null,
      );
      return {
        id: w.id,
        amount: w.amount_fcfa || 0,
        phone: w.phone,
        name: profile?.display_name || profile?.email || "—",
        createdAt: w.created_at,
      };
    }),
    collectionMix,
    openReports: openReports.count || 0,
    weekTotal,
    salesByDay,
    salesByDay30,
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
    recentPurchases: (recentPurchases.data || []).map((p) => {
      const release = one(
        p.releases as { title: string } | { title: string }[] | null,
      );
      const buyer = one(
        p.buyer as
          | { display_name: string | null }
          | { display_name: string | null }[]
          | null,
      );
      return {
        id: p.id,
        title: release?.title || "Achat",
        buyer: buyer?.display_name || "—",
        amount: p.amount_fcfa || 0,
        commission: p.commission_fcfa || 0,
        artistNet: p.artist_net_fcfa || 0,
        status: p.status,
        orderId: p.order_id,
        createdAt: p.created_at,
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
      "id, email, display_name, avatar_url, role, country, phone, balance_fcfa, is_admin, is_suspended, created_at, onboarding_completed, label_plan, label_plan_expires_at, artist_plan, artist_plan_expires_at",
    )
    .eq("role", role)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

/** Artistes catalogue (pour certification admin). */
export async function listArtistsAdmin(limit = 120) {
  const db = createAdminClient();
  const { data } = await db
    .from("artists")
    .select(
      "id, public_id, stage_name, avatar_url, country, is_verified, created_at, owner_id, label_id, profiles!artists_owner_id_fkey(display_name, email, role)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export type AdminArtistRelease = {
  id: string;
  public_id: string;
  title: string;
  type: string;
  status: string;
  price_fcfa: number;
  genre: string | null;
  cover_url: string | null;
  is_hidden: boolean;
  created_at: string;
  tracksCount: number;
};

export type AdminArtistDetail = {
  artist: {
    id: string;
    public_id: string;
    stage_name: string;
    avatar_url: string | null;
    country: string | null;
    bio: string | null;
    is_verified: boolean;
    created_at: string;
    owner_id: string;
    label_id: string | null;
  };
  owner: {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
    role: string;
    country: string | null;
    phone: string | null;
    balance_fcfa: number;
    is_suspended: boolean;
    onboarding_completed: boolean;
    artist_plan: string | null;
    artist_plan_expires_at: string | null;
    label_plan: string | null;
    label_plan_expires_at: string | null;
    created_at: string;
  } | null;
  releases: AdminArtistRelease[];
  stats: {
    releasesCount: number;
    publishedCount: number;
    hiddenCount: number;
    salesCount: number;
    salesFcfa: number;
  };
};

/** Détail admin d’un artiste catalogue (+ compte owner + releases). */
export async function getArtistAdminDetail(
  artistId: string,
): Promise<AdminArtistDetail | null> {
  if (!artistId) return null;
  const db = createAdminClient();

  const { data: artist } = await db
    .from("artists")
    .select(
      "id, public_id, stage_name, avatar_url, country, bio, is_verified, created_at, owner_id, label_id",
    )
    .eq("id", artistId)
    .maybeSingle();

  if (!artist) return null;

  const [{ data: owner }, { data: releases }] = await Promise.all([
    db
      .from("profiles")
      .select(
        "id, email, display_name, avatar_url, role, country, phone, balance_fcfa, is_suspended, onboarding_completed, artist_plan, artist_plan_expires_at, label_plan, label_plan_expires_at, created_at",
      )
      .eq("id", artist.owner_id)
      .maybeSingle(),
    db
      .from("releases")
      .select(
        "id, public_id, title, type, status, price_fcfa, genre, cover_url, is_hidden, created_at, tracks(count)",
      )
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const releaseRows: AdminArtistRelease[] = (releases || []).map((r) => {
    const tracks = r.tracks as { count: number }[] | null;
    return {
      id: r.id,
      public_id: r.public_id,
      title: r.title,
      type: r.type,
      status: r.status,
      price_fcfa: Number(r.price_fcfa) || 0,
      genre: r.genre,
      cover_url: r.cover_url,
      is_hidden: Boolean(r.is_hidden),
      created_at: r.created_at,
      tracksCount: tracks?.[0]?.count || 0,
    };
  });

  const releaseIds = releaseRows.map((r) => r.id);
  let salesCount = 0;
  let salesFcfa = 0;
  if (releaseIds.length > 0) {
    const { data: sales } = await db
      .from("purchases")
      .select("id, amount_fcfa")
      .eq("status", "completed")
      .in("release_id", releaseIds);
    salesCount = sales?.length || 0;
    salesFcfa = (sales || []).reduce(
      (sum, s) => sum + (Number(s.amount_fcfa) || 0),
      0,
    );
  }

  return {
    artist: {
      id: artist.id,
      public_id: artist.public_id,
      stage_name: artist.stage_name,
      avatar_url: artist.avatar_url,
      country: artist.country,
      bio: artist.bio,
      is_verified: Boolean(artist.is_verified),
      created_at: artist.created_at,
      owner_id: artist.owner_id,
      label_id: artist.label_id,
    },
    owner: owner
      ? {
          id: owner.id,
          email: owner.email,
          display_name: owner.display_name,
          avatar_url: owner.avatar_url,
          role: owner.role,
          country: owner.country,
          phone: owner.phone,
          balance_fcfa: Number(owner.balance_fcfa) || 0,
          is_suspended: Boolean(owner.is_suspended),
          onboarding_completed: Boolean(owner.onboarding_completed),
          artist_plan: owner.artist_plan,
          artist_plan_expires_at: owner.artist_plan_expires_at,
          label_plan: owner.label_plan,
          label_plan_expires_at: owner.label_plan_expires_at,
          created_at: owner.created_at,
        }
      : null,
    releases: releaseRows,
    stats: {
      releasesCount: releaseRows.length,
      publishedCount: releaseRows.filter((r) => r.status === "published").length,
      hiddenCount: releaseRows.filter((r) => r.is_hidden).length,
      salesCount,
      salesFcfa,
    },
  };
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

export type AdminPlaylistRow = {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  ownerName: string;
  ownerEmail: string | null;
  tracks: number;
  saves: number;
};

/** Playlists créées par les utilisateurs (publiques et privées), pour la modération. */
export async function listPlaylistsAdmin(limit = 300): Promise<AdminPlaylistRow[]> {
  const db = createAdminClient();
  const { data: playlists } = await db
    .from("playlists")
    .select("id, user_id, title, description, cover_url, is_public, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);
  const rows = playlists ?? [];
  if (!rows.length) return [];

  const ids = rows.map((p) => p.id);
  const userIds = [...new Set(rows.map((p) => p.user_id))];
  const [{ data: owners }, { data: tracks }, { data: saves }] = await Promise.all([
    db.from("profiles").select("id, display_name, email").in("id", userIds),
    db.from("playlist_tracks").select("playlist_id").in("playlist_id", ids),
    db.from("playlist_saves").select("playlist_id").in("playlist_id", ids),
  ]);

  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o]));
  const count = (list: { playlist_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of list ?? []) m.set(r.playlist_id, (m.get(r.playlist_id) ?? 0) + 1);
    return m;
  };
  const trackCount = count(tracks);
  const saveCount = count(saves);

  return rows.map((p) => {
    const owner = ownerMap.get(p.user_id);
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      coverUrl: p.cover_url,
      isPublic: p.is_public,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      ownerName: owner?.display_name || "—",
      ownerEmail: owner?.email ?? null,
      tracks: trackCount.get(p.id) ?? 0,
      saves: saveCount.get(p.id) ?? 0,
    };
  });
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

export type LedgerKind =
  | "purchase"
  | "label_plan"
  | "artist_plan"
  | "withdrawal";

export type AdminLedgerRow = {
  id: string;
  kind: LedgerKind;
  status: PaymentStatus | string;
  amountFcfa: number;
  createdAt: string;
  title: string;
  party: string;
  partyEmail: string;
  counterparty: string;
  method: string;
  provider: string;
  orderId: string | null;
  phone: string | null;
};

function profileLabel(
  p:
    | { display_name: string | null; email: string | null }
    | { display_name: string | null; email: string | null }[]
    | null
    | undefined,
) {
  const row = one(p);
  return {
    name: row?.display_name?.trim() || row?.email || "—",
    email: row?.email || "",
  };
}

export async function listAdminLedger(limit = 250): Promise<AdminLedgerRow[]> {
  // Synchronise les pending > 5 min → failed avant lecture admin.
  try {
    const { expireStalePendingPayins } = await import(
      "@/lib/purchases/expire-pending"
    );
    await expireStalePendingPayins();
  } catch {
    /* ne bloque pas la liste */
  }

  const db = createAdminClient();
  const [purchases, labels, artists, withdrawals] = await Promise.all([
    db
      .from("purchases")
      .select(
        "id, amount_fcfa, payment_method, status, provider, order_id, payer_phone, created_at, releases(title), buyer:profiles!purchases_buyer_id_fkey(display_name, email), seller:profiles!purchases_seller_id_fkey(display_name, email)",
      )
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("label_plan_orders")
      .select(
        "id, plan, amount_fcfa, payment_method, status, provider, order_id, payer_phone, created_at, profiles(display_name, email)",
      )
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("artist_plan_orders")
      .select(
        "id, plan, amount_fcfa, payment_method, status, provider, order_id, payer_phone, created_at, profiles(display_name, email)",
      )
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("withdrawals")
      .select(
        "id, amount_fcfa, payment_method, phone, status, provider, order_id, created_at, profiles(display_name, email)",
      )
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const rows: AdminLedgerRow[] = [];

  for (const p of purchases.data || []) {
    const release = one(
      p.releases as { title: string } | { title: string }[] | null,
    );
    const buyer = profileLabel(p.buyer);
    const seller = profileLabel(p.seller);
    rows.push({
      id: `purchase:${p.id}`,
      kind: "purchase",
      status: p.status,
      amountFcfa: p.amount_fcfa || 0,
      createdAt: p.created_at,
      title: release?.title || "Achat musique",
      party: buyer.name,
      partyEmail: buyer.email,
      counterparty: seller.name,
      method: p.payment_method,
      provider: p.provider,
      orderId: p.order_id,
      phone: p.payer_phone,
    });
  }

  for (const o of labels.data || []) {
    const profile = profileLabel(o.profiles);
    rows.push({
      id: `label:${o.id}`,
      kind: "label_plan",
      status: o.status,
      amountFcfa: o.amount_fcfa || 0,
      createdAt: o.created_at,
      title: `Abo label · ${o.plan}`,
      party: profile.name,
      partyEmail: profile.email,
      counterparty: "Gootunes",
      method: o.payment_method,
      provider: o.provider,
      orderId: o.order_id,
      phone: o.payer_phone,
    });
  }

  for (const o of artists.data || []) {
    const profile = profileLabel(o.profiles);
    rows.push({
      id: `artist:${o.id}`,
      kind: "artist_plan",
      status: o.status,
      amountFcfa: o.amount_fcfa || 0,
      createdAt: o.created_at,
      title: `Abo artiste · ${o.plan}`,
      party: profile.name,
      partyEmail: profile.email,
      counterparty: "Gootunes",
      method: o.payment_method,
      provider: o.provider,
      orderId: o.order_id,
      phone: o.payer_phone,
    });
  }

  for (const w of withdrawals.data || []) {
    const profile = profileLabel(w.profiles);
    rows.push({
      id: `withdraw:${w.id}`,
      kind: "withdrawal",
      status: w.status,
      amountFcfa: w.amount_fcfa || 0,
      createdAt: w.created_at,
      title: "Retrait",
      party: profile.name,
      partyEmail: profile.email,
      counterparty: w.phone,
      method: w.payment_method,
      provider: w.provider,
      orderId: w.order_id,
      phone: w.phone,
    });
  }

  rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return rows;
}

export type SubscriptionKind = "artist_plan" | "label_plan";

export type AdminSubscriptionRow = {
  id: string;
  kind: SubscriptionKind;
  plan: string;
  status: string;
  amountFcfa: number;
  createdAt: string;
  party: string;
  partyEmail: string;
  method: string;
  orderId: string | null;
  phone: string | null;
};

export type AdminSubscriptionRevenue = {
  rows: AdminSubscriptionRow[];
  totals: {
    artistCompletedFcfa: number;
    labelCompletedFcfa: number;
    allCompletedFcfa: number;
    artistCount: number;
    labelCount: number;
  };
};

/** Revenus abonnements artistes + labels (tous statuts, totaux = completed). */
export async function listAdminSubscriptionRevenue(
  limit = 300,
): Promise<AdminSubscriptionRevenue> {
  // Synchronise les pending > 5 min → failed avant lecture admin.
  try {
    const { expireStalePendingPayins } = await import(
      "@/lib/purchases/expire-pending"
    );
    await expireStalePendingPayins();
  } catch {
    /* ne bloque pas la liste */
  }

  const db = createAdminClient();
  const [labels, artists] = await Promise.all([
    db
      .from("label_plan_orders")
      .select(
        "id, plan, amount_fcfa, payment_method, status, order_id, payer_phone, created_at, profiles(display_name, email)",
      )
      .order("created_at", { ascending: false })
      .limit(limit),
    db
      .from("artist_plan_orders")
      .select(
        "id, plan, amount_fcfa, payment_method, status, order_id, payer_phone, created_at, profiles(display_name, email)",
      )
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const rows: AdminSubscriptionRow[] = [];

  for (const o of labels.data || []) {
    const profile = profileLabel(o.profiles);
    rows.push({
      id: `label:${o.id}`,
      kind: "label_plan",
      plan: o.plan,
      status: o.status,
      amountFcfa: o.amount_fcfa || 0,
      createdAt: o.created_at,
      party: profile.name,
      partyEmail: profile.email,
      method: o.payment_method,
      orderId: o.order_id,
      phone: o.payer_phone,
    });
  }

  for (const o of artists.data || []) {
    const profile = profileLabel(o.profiles);
    rows.push({
      id: `artist:${o.id}`,
      kind: "artist_plan",
      plan: o.plan,
      status: o.status,
      amountFcfa: o.amount_fcfa || 0,
      createdAt: o.created_at,
      party: profile.name,
      partyEmail: profile.email,
      method: o.payment_method,
      orderId: o.order_id,
      phone: o.payer_phone,
    });
  }

  rows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  let artistCompletedFcfa = 0;
  let labelCompletedFcfa = 0;
  let artistCount = 0;
  let labelCount = 0;
  for (const row of rows) {
    if (row.status !== "completed") continue;
    if (row.kind === "artist_plan") {
      artistCompletedFcfa += row.amountFcfa;
      artistCount += 1;
    } else {
      labelCompletedFcfa += row.amountFcfa;
      labelCount += 1;
    }
  }

  return {
    rows,
    totals: {
      artistCompletedFcfa,
      labelCompletedFcfa,
      allCompletedFcfa: artistCompletedFcfa + labelCompletedFcfa,
      artistCount,
      labelCount,
    },
  };
}

export type AdminSystemLog = {
  id: string;
  level: string;
  source: string;
  message: string;
  stack: string | null;
  path: string | null;
  digest: string | null;
  userAgent: string | null;
  createdAt: string;
};

export async function listSystemLogsAdmin(limit = 200): Promise<AdminSystemLog[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("system_logs")
    .select(
      "id, level, source, message, stack, path, digest, user_agent, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[admin.system_logs]", error.message);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    level: row.level,
    source: row.source,
    message: row.message,
    stack: row.stack,
    path: row.path,
    digest: row.digest,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  }));
}

/** Compteurs affichés dans la barre latérale de la console admin. */
export async function getAdminSidebarCounts() {
  const db = createAdminClient();
  const [reports, withdrawals, settings] = await Promise.all([
    db
      .from("track_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    db
      .from("withdrawals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("site_settings")
      .select("maintenance_enabled")
      .eq("id", 1)
      .maybeSingle(),
  ]);
  return {
    openReports: reports.count ?? 0,
    pendingWithdrawals: withdrawals.count ?? 0,
    maintenance: Boolean(settings.data?.maintenance_enabled),
  };
}
