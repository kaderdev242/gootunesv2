"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Home01Icon,
  MusicNote01Icon,
  AnalyticsUpIcon,
  ChartHistogramIcon,
  CrownIcon,
  Folder01Icon,
  Money01Icon,
  Settings01Icon,
  SparklesIcon,
  UserMultipleIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { DashFrame, type DashNavSection } from "@/components/admin/console/DashFrame";
import type { CreatorBase } from "@/lib/dashboard/paths";
import type { MobileNavItem } from "@/components/ui/MobileNav";
import type { Profile } from "@/lib/supabase/database.types";
import { formatMoney } from "@/lib/format";

function navFor(basePath: CreatorBase, isLabel: boolean, retro: boolean): DashNavSection[] {
  return [
    {
      items: [
        { href: basePath, label: "Vue d'ensemble", icon: ChartHistogramIcon, exact: true },
        { href: `${basePath}/publications`, label: "Publications", icon: Folder01Icon },
        ...(isLabel ? [{ href: `${basePath}/artistes`, label: "Artistes", icon: UserMultipleIcon }] : []),
        { href: `${basePath}/statistiques`, label: "Statistiques", icon: AnalyticsUpIcon },
        ...(retro ? [{ href: `${basePath}/retro`, label: "Rétro", icon: SparklesIcon }] : []),
      ],
    },
    {
      title: "Argent",
      items: [
        { href: `${basePath}/revenus`, label: "Revenus", icon: Money01Icon },
        { href: `${basePath}/retraits`, label: "Retraits", icon: Wallet01Icon },
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

/** Mobile : les 4 pages du quotidien en onglets. */
function mobileTabsFor(basePath: CreatorBase): MobileNavItem[] {
  return [
    { href: basePath, label: "Accueil", icon: Home01Icon, exact: true },
    { href: `${basePath}/publications`, label: "Publications", icon: Folder01Icon },
    { href: `${basePath}/revenus`, label: "Revenus", icon: Money01Icon },
    { href: `${basePath}/retraits`, label: "Retraits", icon: Wallet01Icon },
  ];
}

/** Mobile : le reste, depuis l'avatar. */
function mobileMenuFor(basePath: CreatorBase, isLabel: boolean, retro: boolean): MobileNavItem[] {
  return [
    { href: `${basePath}/statistiques`, label: "Statistiques", icon: AnalyticsUpIcon },
    ...(retro ? [{ href: `${basePath}/retro`, label: "Rétro", icon: SparklesIcon }] : []),
    ...(isLabel ? [{ href: `${basePath}/artistes`, label: "Artistes", icon: UserMultipleIcon }] : []),
    { href: `${basePath}/abonnement`, label: "Abonnement", icon: CrownIcon },
    { href: `${basePath}/parametres`, label: "Paramètres", icon: Settings01Icon },
    { href: "/", label: "Écouter sur Discover", icon: MusicNote01Icon },
  ];
}

export function DashboardShell({
  profile,
  basePath,
  features = [],
  children,
}: {
  profile: Profile;
  basePath: CreatorBase;
  /** Fonctionnalités exclusives activées par l'admin */
  features?: string[];
  children: React.ReactNode;
}) {
  const retro = features.includes("retro");
  const isLabel = basePath === "/label";
  const balance = formatMoney(Number(profile.balance_fcfa || 0), profile.country);

  return (
    <DashFrame
      space={isLabel ? "Label" : "Artiste"}
      sections={navFor(basePath, isLabel, retro)}
      user={{
        name: profile.display_name || (isLabel ? "Mon label" : "Mon espace"),
        subtitle: isLabel ? "Label" : "Artiste",
        avatarUrl: profile.avatar_url,
      }}
      mobileTabs={mobileTabsFor(basePath)}
      mobileMenu={mobileMenuFor(basePath, isLabel, retro)}
      mobileMenuHeader={
        <>
          <p className="truncate text-[16px] font-semibold text-white">
            {profile.display_name || (isLabel ? "Mon label" : "Mon espace")}
          </p>
          <p className="text-[13px] text-white/45">
            Solde disponible <span className="font-medium tabular-nums text-white">{balance}</span>
          </p>
        </>
      }
      sidebarFooter={
        <Link
          href={`${basePath}/retraits`}
          className="block rounded-xl px-3 py-2 transition-colors hover:bg-white/[0.04]"
        >
          <p className="text-[12px] text-white/40">Solde disponible</p>
          <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-white">{balance}</p>
        </Link>
      }
      headerRight={
        <Link
          href={`${basePath}/publications?nouveau=1`}
          className="hidden h-10 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-medium text-black transition-[background-color,transform] duration-150 hover:bg-white/90 active:scale-[0.97] lg:inline-flex"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
          Publier
        </Link>
      }
    >
      {children}
    </DashFrame>
  );
}
