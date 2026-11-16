import Link from "next/link";
import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { formatDate, formatMoney } from "@/lib/format";
import { LICENSES } from "@/lib/prods/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_COVER } from "@/lib/types/music";

export const metadata = { title: "Mes achats", robots: { index: false } };

const FILE_LABEL = { mp3: "MP3", wav: "WAV", stems: "Stems (ZIP)" } as const;

export default async function BeatPurchasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?next=/prods/achats");

  const { data: orders } = await supabase
    .from("beat_orders")
    .select("order_id, license, amount_fcfa, created_at, beat_id, beats(public_id, title, cover_url, artists(stage_name))")
    .eq("buyer_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  // Fichiers réellement fournis par le beatmaker (lecture service role : table privée).
  const beatIds = [...new Set((orders ?? []).map((o) => o.beat_id))];
  const { data: files } = beatIds.length
    ? await createAdminClient().from("beat_files").select("beat_id, mp3_key, wav_key, stems_key").in("beat_id", beatIds)
    : { data: [] };
  const provided = new Map(
    (files ?? []).map((f) => [f.beat_id, { mp3: !!f.mp3_key, wav: !!f.wav_key, stems: !!f.stems_key }]),
  );
  const { data: profile } = await supabase.from("profiles").select("country").eq("id", user.id).maybeSingle();

  return (
    <div className="pt-8">
      <h1 className="font-display text-[34px] font-bold tracking-[-0.03em]">Mes achats</h1>
      <p className="mt-1 text-sm text-white/50">Tes licences et tes fichiers sans tag, à télécharger quand tu veux.</p>

      {!orders?.length ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-white/10 px-6 py-16 text-center">
          <p className="font-semibold text-white">Aucune prod achetée pour l&apos;instant</p>
          <Link href="/prods" className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-black">
            Explorer les prods
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {orders.map((o) => {
            const beat = (Array.isArray(o.beats) ? o.beats[0] : o.beats) as {
              public_id: string;
              title: string;
              cover_url: string | null;
              artists: { stage_name: string } | { stage_name: string }[] | null;
            } | null;
            const artist = Array.isArray(beat?.artists) ? beat?.artists[0] : beat?.artists;
            const avail = provided.get(o.beat_id);
            const dl = LICENSES[o.license].files.filter((f) => avail?.[f]);
            return (
              <li key={o.order_id} className="flex flex-col gap-4 rounded-[28px] border border-white/[0.06] bg-[#0a0a0a] p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                    <AppImage src={beat?.cover_url || FALLBACK_COVER} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <Link href={beat ? `/prods/b/${beat.public_id}` : "/prods"} className="block truncate font-semibold text-white hover:underline">
                      {beat?.title || "Prod"}
                    </Link>
                    <p className="truncate text-xs text-white/45">
                      {artist?.stage_name || "Beatmaker"} · {LICENSES[o.license].name} · {formatMoney(Number(o.amount_fcfa), profile?.country)} · {formatDate(o.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dl.map((f) => (
                    <a
                      key={f}
                      href={`/api/prods/download/${o.order_id}?file=${f}`}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
                    >
                      <HugeiconsIcon icon={Download04Icon} size={16} />
                      {FILE_LABEL[f]}
                    </a>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
