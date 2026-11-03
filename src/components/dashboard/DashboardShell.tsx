"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  AnalyticsUpIcon,
  ChartHistogramIcon,
  CrownIcon,
  Folder01Icon,
  Money01Icon,
  Settings01Icon,
  UserMultipleIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import {
  StudioShell,
  type StudioNavSection,
} from "@/components/studio/StudioShell";
import type { CreatorBase } from "@/lib/dashboard/paths";
import type { Profile } from "@/lib/supabase/database.types";
import { formatMoney } from "@/lib/format";

function navFor(basePath: CreatorBase, isLabel: boolean): StudioNavSection[] {
  const catalogue = [
    { href: basePath, label: "Vue d'ensemble", icon: ChartHistogramIcon, exact: true },
    { href: `${basePath}/publications`, label: "Publications", icon: Folder01Icon },
    ...(isLabel
      ? [{ href: `${basePath}/artistes`, label: "Artistes", icon: UserMultipleIcon }]
      : []),
  ];
  return [
    { title: "Catalogue", items: catalogue },
    {
      title: "Finances",
      items: [
        { href: `${basePath}/revenus`, label: "Revenus", icon: Money01Icon },
        { href: `${basePath}/retraits`, label: "Retraits", icon: Wallet01Icon },
        { href: `${basePath}/statistiques`, label: "Statistiques", icon: AnalyticsUpIcon },
      ],
    },
    {
      title: "Compte",
      items: [
        { href: `${basePath}/abonnement`, label: "Abonnement", icon: CrownIcon },
        { href: `${basePath}/parametres`, label: "Paramètres", icon: Settings01Icon },
      ],
    },
  ];
}

export function DashboardShell({
  profile,
  basePath,
  children,
}: {
  profile: Profile;
  basePath: CreatorBase;
  children: React.ReactNode;
}) {
  const isLabel = basePath === "/label";
  const balance = formatMoney(Number(profile.balance_fcfa || 0), profile.country);

  return (
    <StudioShell
      space={isLabel ? "Label" : "Artiste"}
      sections={navFor(basePath, isLabel)}
      user={{
        name: profile.display_name || (isLabel ? "Mon label" : "Mon espace"),
        subtitle: isLabel ? "Espace label" : "Espace artiste",
        avatarUrl: profile.avatar_url,
      }}
      sidebarFooter={
        <Link
          href={`${basePath}/retraits`}
          className="studio-ink-card block p-4 transition hover:brightness-110"
        >
          <p className="text-[11px] font-medium text-white/55">Solde disponible</p>
          <p className="studio-num mt-1 text-[22px] font-semibold leading-tight">
            {balance}
          </p>
          <span className="mt-3 inline-flex items-center rounded-full bg-[var(--studio-accent)] px-3 py-1 text-[11px] font-semibold text-[var(--studio-accent-ink)]">
            Retirer en Mobile Money
          </span>
        </Link>
      }
      headerExtra={
        <Link
          href={`${basePath}/publications?nouveau=1`}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
          <span className="hidden sm:inline">Publier</span>
        </Link>
      }
    >
      {children}
    </StudioShell>
  );
}
