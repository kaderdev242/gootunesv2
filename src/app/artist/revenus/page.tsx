import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { formatMoney, formatDate } from "@/lib/format";

export default async function RevenusPage() {
  const session = await requireCreatorProfile();
  if (!session) redirect("/connexion");

  const country = session.profile.country;
  const money = (n: number) => formatMoney(n, country);

  const supabase = await createClient();
  const { data: purchases } = await supabase
    .from("purchases")
    .select("*, releases(title)")
    .eq("seller_id", session.userId)
    .order("created_at", { ascending: false });

  const rows = purchases ?? [];
  const net = rows
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + Number(p.artist_net_fcfa), 0);
  const commission = rows
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + Number(p.commission_fcfa), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-bold">Revenus</h1>
      <p className="mt-1 text-sm text-white/45">
        Suivi des ventes — commission Gootunes 20%, net 80%.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/45">Net cumulé</p>
          <p className="mt-2 text-2xl font-bold">{money(net)}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/45">Commission Gootunes</p>
          <p className="mt-2 text-2xl font-bold">{money(commission)}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs text-white/45">Solde retirable</p>
          <p className="mt-2 text-2xl font-bold">
            {money(Number(session.profile.balance_fcfa))}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        {rows.length === 0 ? (
          <p className="text-sm text-white/40">Aucune transaction.</p>
        ) : (
          rows.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm sm:grid-cols-5"
            >
              <span className="text-white/50">{formatDate(p.created_at)}</span>
              <span className="truncate font-medium text-white sm:col-span-2">
                {(p.releases as { title?: string } | null)?.title || "Release"}
              </span>
              <span className="text-white/60">{p.payment_method}</span>
              <span className="text-right font-semibold text-white">
                +{money(Number(p.artist_net_fcfa))}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
