import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  AnalyticsUpIcon,
  Folder01Icon,
  Money01Icon,
  SmartPhone01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { formatMoney } from "@/lib/format";
import { isApplePaymentMethod } from "@/lib/purchases/apple-tiers";
import {
  StatCard,
  StudioBars,
  StudioButton,
  StudioCard,
  StudioCardHeader,
  StudioChip,
  StudioEmpty,
  StudioPageHeader,
} from "@/components/studio/ui";
import type { CreatorBase } from "@/lib/dashboard/paths";

type Bar = { label: string; value: number };
type Sale = {
  created_at: string;
  artist_net_fcfa: number;
  payment_method?: string | null;
};

export function OverviewStats({
  title,
  subtitle,
  basePath = "/artist",
  balance,
  totalGross,
  totalNet,
  releasesCount,
  bars,
  sales,
  country,
}: {
  title: string;
  subtitle?: string;
  basePath?: CreatorBase;
  balance: number;
  totalGross: number;
  totalNet: number;
  releasesCount: number;
  bars: Bar[];
  sales: Sale[];
  country?: string | null;
}) {
  const money = (n: number) => formatMoney(n, country);
  const momoNet = sales
    .filter((s) => !isApplePaymentMethod(s.payment_method))
    .reduce((s, p) => s + Number(p.artist_net_fcfa), 0);
  const appleNet = sales
    .filter((s) => isApplePaymentMethod(s.payment_method))
    .reduce((s, p) => s + Number(p.artist_net_fcfa), 0);
  const weekNet = bars.reduce((s, b) => s + b.value, 0);

  return (
    <div className="space-y-4">
      <StudioPageHeader
        eyebrow="Vue d'ensemble"
        title={title}
        description={
          subtitle ??
          "Tes revenus, tes ventes et ton catalogue, au même endroit."
        }
        actions={
          <StudioButton
            href={`${basePath}/statistiques`}
            variant="secondary"
            icon={AnalyticsUpIcon}
          >
            Statistiques
          </StudioButton>
        }
      />

      <div className="grid gap-4 pt-2 xl:grid-cols-[1.6fr_1fr]">
        {/* Solde */}
        <StudioCard className="flex flex-col justify-between gap-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-zinc-500">
                Solde retirable
              </p>
              <p className="studio-num mt-3 text-[clamp(38px,5vw,60px)] font-semibold leading-none text-zinc-950">
                {money(balance)}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Retrait en Mobile Money, ventes iOS comprises.
              </p>
            </div>
            <StudioChip tone="dark">Mobile Money</StudioChip>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`${basePath}/retraits`}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <HugeiconsIcon icon={Wallet01Icon} size={16} />
              Retirer
            </Link>
            <Link
              href={`${basePath}/revenus`}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            >
              Voir les revenus
            </Link>
          </div>
        </StudioCard>

        {/* Ventes cumulées */}
        <section className="studio-accent-card flex flex-col justify-between gap-6 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold">Ventes cumulées</p>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
              {sales.length} vente{sales.length > 1 ? "s" : ""}
            </span>
          </div>
          <div>
            <p className="studio-num text-[clamp(30px,3vw,40px)] font-semibold leading-none">
              {money(totalGross)}
            </p>
            <p className="mt-2 text-xs opacity-70">Montant brut payé par tes fans</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/15 px-3 py-2.5">
              <p className="text-[11px] opacity-65">Net gagné</p>
              <p className="mt-0.5 text-sm font-semibold">{money(totalNet)}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-3 py-2.5">
              <p className="text-[11px] opacity-65">Cette semaine</p>
              <p className="mt-0.5 text-sm font-semibold">{money(weekNet)}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Net Mobile Money"
          value={money(momoNet)}
          hint="tu gardes 80 %"
          icon={Money01Icon}
        />
        <StatCard
          label="Net iOS"
          value={money(appleNet)}
          hint="tu gardes 70 %"
          icon={SmartPhone01Icon}
        />
        <StatCard
          label="Publications"
          value={String(releasesCount)}
          hint="singles et albums"
          icon={Folder01Icon}
          tone="ink"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <StudioCard>
          <StudioCardHeader
            title="Revenus nets"
            subtitle={`${money(weekNet)} sur les 7 derniers jours`}
            action={<StudioChip>7 jours</StudioChip>}
          />
          <div className="mt-6">
            <StudioBars bars={bars} format={money} height={210} />
          </div>
        </StudioCard>

        <StudioCard>
          <StudioCardHeader
            title="Dernières ventes"
            subtitle="Ce que tu as touché"
          />
          <div className="mt-4">
            {sales.length === 0 ? (
              <StudioEmpty
                title="Pas encore de vente"
                description="Publie un single ou un album pour commencer à vendre."
                action={
                  <StudioButton href={`${basePath}/publications?nouveau=1`} icon={Add01Icon}>
                    Publier
                  </StudioButton>
                }
              />
            ) : (
              <ul className="space-y-1">
                {sales.slice(0, 7).map((sale, i) => {
                  const apple = isApplePaymentMethod(sale.payment_method);
                  return (
                    <li
                      key={`${sale.created_at}-${i}`}
                      className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-zinc-50"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-black/[0.07] text-zinc-700">
                        <HugeiconsIcon
                          icon={apple ? SmartPhone01Icon : Money01Icon}
                          size={16}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-900">
                          {apple ? "Achat iOS" : "Mobile Money"}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {new Date(sale.created_at).toLocaleString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {apple ? "70 %" : "80 %"}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-emerald-700">
                        +{money(Number(sale.artist_net_fcfa))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </StudioCard>
      </div>
    </div>
  );
}
