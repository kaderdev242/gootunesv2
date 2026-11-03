import { HugeiconsIcon } from "@hugeicons/react";
import { Wallet01Icon } from "@hugeicons/core-free-icons";
import { WithdrawalForm } from "@/components/dashboard/WithdrawalForm";
import { formatDate, formatMoney } from "@/lib/format";
import {
  StudioCard,
  StudioCardHeader,
  StudioEmpty,
  StudioPageHeader,
} from "@/components/studio/ui";

type WithdrawalRow = {
  id: string;
  amount_fcfa: number;
  payment_method: string | null;
  phone: string | null;
  status: string;
  created_at: string;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: "Versé", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  pending: { label: "En cours", cls: "bg-amber-50 text-amber-800 ring-amber-600/15" },
  processing: { label: "En cours", cls: "bg-amber-50 text-amber-800 ring-amber-600/15" },
  failed: { label: "Échec", cls: "bg-red-50 text-red-600 ring-red-600/15" },
  cancelled: { label: "Annulé", cls: "bg-zinc-100 text-zinc-600 ring-black/5" },
};

export function WithdrawalsView({
  balance,
  country,
  phone,
  withdrawals,
}: {
  balance: number;
  country: string | null;
  phone: string | null;
  withdrawals: WithdrawalRow[];
}) {
  const money = (n: number) => formatMoney(n, country);
  const paidOut = withdrawals
    .filter((w) => w.status === "completed")
    .reduce((s, w) => s + Number(w.amount_fcfa), 0);

  return (
    <div className="space-y-4">
      <StudioPageHeader
        eyebrow="Finances"
        title="Retraits"
        description="Transfère ton solde vers ton compte Mobile Money."
      />

      <div className="grid gap-4 pt-2 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4">
          <section className="studio-accent-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-semibold">Solde disponible</p>
              <span className="flex size-9 items-center justify-center rounded-full bg-white/20">
                <HugeiconsIcon icon={Wallet01Icon} size={16} />
              </span>
            </div>
            <p className="studio-num mt-4 text-[clamp(32px,3.6vw,44px)] font-semibold leading-none">
              {money(balance)}
            </p>
            <p className="mt-2 text-xs opacity-70">
              Déjà versé : {money(paidOut)}
            </p>
          </section>

          <StudioCard>
            <StudioCardHeader title="Nouveau retrait" subtitle="Reçu en quelques minutes" />
            <div className="mt-5">
              <WithdrawalForm balance={balance} country={country} phone={phone} />
            </div>
          </StudioCard>
        </div>

        <StudioCard padded={false} className="overflow-hidden self-start">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <StudioCardHeader
              title="Historique"
              subtitle={`${withdrawals.length} retrait${withdrawals.length > 1 ? "s" : ""}`}
            />
          </div>
          {withdrawals.length === 0 ? (
            <div className="p-5 sm:p-6">
              <StudioEmpty
                title="Aucun retrait"
                description="Tes demandes de retrait apparaîtront ici."
              />
            </div>
          ) : (
            <ul className="mt-3">
              {withdrawals.map((w) => {
                const st = STATUS[w.status] ?? {
                  label: w.status,
                  cls: "bg-zinc-100 text-zinc-600 ring-black/5",
                };
                return (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-3 border-t border-black/[0.05] px-5 py-3.5 sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-950">
                        {money(Number(w.amount_fcfa))}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {[w.payment_method, w.phone, formatDate(w.created_at)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </StudioCard>
      </div>
    </div>
  );
}
