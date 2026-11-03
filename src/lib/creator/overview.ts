import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function getCreatorHome(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const [{ data: purchases }, { count: releasesCount }, { count: artistsCount }] =
    await Promise.all([
      supabase
        .from("purchases")
        .select("id, amount_fcfa, artist_net_fcfa, created_at, status, payment_method")
        .eq("seller_id", userId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(400),
      supabase
        .from("releases")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId),
      supabase
        .from("artists")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId),
    ]);

  const sales = purchases ?? [];
  const totalGross = sales.reduce((s, p) => s + Number(p.amount_fcfa), 0);
  const totalNet = sales.reduce((s, p) => s + Number(p.artist_net_fcfa), 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const bars = days.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const sum = sales
      .filter((p) => {
        const t = new Date(p.created_at).getTime();
        return t >= day.getTime() && t < next.getTime();
      })
      .reduce((s, p) => s + Number(p.artist_net_fcfa), 0);
    return {
      label: day.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      }),
      value: sum,
    };
  });

  return {
    total_gross: totalGross,
    total_net: totalNet,
    releases_count: releasesCount ?? 0,
    artists_count: artistsCount ?? 0,
    bars,
    recent_sales: sales.slice(0, 8).map((p) => ({
      id: p.id,
      amount_fcfa: Number(p.amount_fcfa) || 0,
      artist_net_fcfa: Number(p.artist_net_fcfa) || 0,
      created_at: p.created_at,
      payment_method: p.payment_method,
    })),
  };
}
