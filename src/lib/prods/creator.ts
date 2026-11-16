import { isFeatureEnabled } from "@/lib/features";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BeatRow } from "@/components/dashboard/BeatsManager";

/** Prods du créateur + nombre de ventes (null si la fonctionnalité est coupée). */
export async function getCreatorBeats(userId: string): Promise<BeatRow[] | null> {
  if (!(await isFeatureEnabled("prods"))) return null;
  try {
    const admin = createAdminClient();
    const { data: beats } = await admin
      .from("beats")
      .select(
        "id, public_id, title, cover_url, bpm, musical_key, is_hidden, plays_count, price_mp3_fcfa, price_wav_fcfa, price_stems_fcfa",
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (!beats?.length) return [];

    const { data: orders } = await admin
      .from("beat_orders")
      .select("beat_id")
      .eq("seller_id", userId)
      .eq("status", "completed");
    const sales = new Map<string, number>();
    for (const o of orders ?? []) sales.set(o.beat_id, (sales.get(o.beat_id) ?? 0) + 1);

    return beats.map((b) => ({ ...b, sales: sales.get(b.id) ?? 0 }));
  } catch {
    // Table absente (migration pas encore passée) : on n'affiche rien.
    return null;
  }
}
