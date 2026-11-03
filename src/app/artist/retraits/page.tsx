import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCreatorProfile } from "@/lib/auth/get-profile";
import { WithdrawalForm } from "@/components/dashboard/WithdrawalForm";
import { formatMoney, formatDate } from "@/lib/format";

export default async function RetraitsPage() {
  const session = await requireCreatorProfile();
  if (!session) redirect("/connexion");

  const country = session.profile.country;
  const money = (n: number) => formatMoney(n, country);

  const supabase = await createClient();
  const { data: withdrawals } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("profile_id", session.userId)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-bold">Retraits</h1>
      <p className="mt-1 text-sm text-white/45">
        Solde disponible :{" "}
        <span className="font-semibold text-white">
          {money(Number(session.profile.balance_fcfa))}
        </span>
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <WithdrawalForm
          balance={Number(session.profile.balance_fcfa)}
          country={session.profile.country}
          phone={session.profile.phone}
        />
        <div>
          <h2 className="mb-3 text-lg font-semibold">Historique</h2>
          <div className="flex flex-col gap-2">
            {(withdrawals ?? []).length === 0 ? (
              <p className="text-sm text-white/40">Aucun retrait.</p>
            ) : (
              withdrawals!.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">
                      {money(Number(w.amount_fcfa))}
                    </p>
                    <p className="text-xs text-white/40">
                      {w.payment_method} · {w.phone} · {formatDate(w.created_at)}
                    </p>
                  </div>
                  <span
                    className={`text-xs ${
                      w.status === "completed"
                        ? "text-emerald-300"
                        : w.status === "pending"
                          ? "text-amber-200"
                          : "text-red-300"
                    }`}
                  >
                    {w.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
