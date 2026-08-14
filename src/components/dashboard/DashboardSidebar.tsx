"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AnalyticsUpIcon,
  ChartHistogramIcon,
  Folder01Icon,
  Money01Icon,
  Settings01Icon,
  UserMultipleIcon,
  Wallet01Icon,
  CrownIcon,
} from "@hugeicons/core-free-icons";
import { Logo } from "@/components/landing/Logo";
import { signOut } from "@/lib/actions/auth";
import type { CreatorBase } from "@/lib/dashboard/paths";
import type { Profile } from "@/lib/supabase/database.types";
import { GenreChips } from "@/components/genres/GenrePicker";
import { formatMoney } from "@/lib/format";

type NavItem = {
  href: string;
  label: string;
  icon: typeof ChartHistogramIcon;
  exact?: boolean;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

function navForBase(basePath: CreatorBase, role: Profile["role"]): NavSection[] {
  if (role === "label") {
    return [
      {
        title: "Catalogue",
        items: [
          { href: basePath, label: "Vue d'ensemble", icon: ChartHistogramIcon, exact: true },
          { href: `${basePath}/publications`, label: "Publications", icon: Folder01Icon },
          { href: `${basePath}/artistes`, label: "Artistes", icon: UserMultipleIcon },
        ],
      },
      {
        title: "Finance",
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

  return [
    {
      items: [
        { href: basePath, label: "Vue d'ensemble", icon: ChartHistogramIcon, exact: true },
        { href: `${basePath}/publications`, label: "Publications", icon: Folder01Icon },
        { href: `${basePath}/revenus`, label: "Revenus", icon: Money01Icon },
        { href: `${basePath}/retraits`, label: "Retraits", icon: Wallet01Icon },
        { href: `${basePath}/statistiques`, label: "Statistiques", icon: AnalyticsUpIcon },
        { href: `${basePath}/abonnement`, label: "Abonnement", icon: CrownIcon },
        { href: `${basePath}/parametres`, label: "Paramètres", icon: Settings01Icon },
      ],
    },
  ];
}

type Props = {
  profile: Profile;
  basePath: CreatorBase;
  open?: boolean;
  onClose?: () => void;
};

export function DashboardSidebar({
  profile,
  basePath,
  open = false,
  onClose,
}: Props) {
  const pathname = usePathname();
  const sections = navForBase(basePath, profile.role);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[272px] flex-col border-r border-white/8 bg-[#070707] px-4 py-5 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/" className="mb-6 px-1" onClick={onClose}>
          <Logo size="sm" />
        </Link>

        <div className="violet-card mb-6 overflow-hidden rounded-3xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 ring-2 ring-white/15">
              {profile.avatar_url ? (
                <Avatar.Image
                  src={profile.avatar_url}
                  alt={profile.display_name || ""}
                />
              ) : null}
              <Avatar.Fallback>
                {(profile.display_name || "G").slice(0, 1).toUpperCase()}
              </Avatar.Fallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {profile.display_name || "Compte"}
              </p>
              <p className="truncate text-xs text-white/45 capitalize">
                {profile.role === "label" ? "Espace label" : "Espace artiste"}
              </p>
            </div>
          </div>
          {profile.genres?.length ? (
            <GenreChips genres={profile.genres.slice(0, 3)} className="mt-3" />
          ) : null}
          <p className="mt-3 text-[11px] text-white/40">
            Solde ·{" "}
            <span className="font-semibold text-white/80">
              {formatMoney(Number(profile.balance_fcfa || 0), profile.country)}
            </span>
          </p>
        </div>

        <nav className="scrollbar-thin flex flex-1 flex-col gap-5 overflow-y-auto">
          {sections.map((section, sIdx) => (
            <div key={section.title || `section-${sIdx}`} className="flex flex-col gap-1">
              {section.title ? (
                <p className="mb-1 px-3 text-[10px] font-semibold tracking-[0.16em] text-white/30 uppercase">
                  {section.title}
                </p>
              ) : null}
              {section.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                        : "text-white/55 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <HugeiconsIcon icon={item.icon} size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <form action={signOut} className="mt-3">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-white/50"
          >
            Se déconnecter
          </Button>
        </form>
      </aside>
    </>
  );
}
