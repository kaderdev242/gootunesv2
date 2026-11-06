"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, UserIcon } from "@hugeicons/core-free-icons";

type IconType = typeof UserIcon;

export type MobileNavItem = {
  href: string;
  label: string;
  icon: IconType;
  /** Actif seulement sur l'URL exacte (sinon : préfixe). */
  exact?: boolean;
  /** Autres URLs qui activent aussi l'onglet. */
  alsoActive?: string[];
};

export function isMobileItemActive(pathname: string, item: MobileNavItem) {
  const match = (href: string) => (item.exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  return match(item.href) || (item.alsoActive ?? []).some((h) => pathname === h);
}

/** Hauteur de la barre d'onglets (hors zone de sécurité de l'écran). */
export const MOBILE_TAB_HEIGHT = 56;

/** Barre d'onglets fixée en bas, visible uniquement sur mobile et tablette. */
export function MobileTabBar({ items }: { items: MobileNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-black pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid h-14" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = isMobileItemActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                  active ? "text-white" : "text-white/50 active:text-white/80"
                }`}
              >
                <HugeiconsIcon icon={item.icon} size={22} strokeWidth={active ? 2 : 1.5} />
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Bouton avatar de l'en-tête mobile : ouvre le panneau des autres pages. */
export function MobileAvatarButton({
  name,
  avatarUrl,
  onClick,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ouvrir le menu du compte"
      className="flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.96] lg:hidden"
    >
      {name ? (
        <Avatar className="size-9">
          {avatarUrl ? <Avatar.Image alt={name} src={avatarUrl} /> : null}
          <Avatar.Fallback>{name.slice(0, 1).toUpperCase()}</Avatar.Fallback>
        </Avatar>
      ) : (
        <span className="flex size-9 items-center justify-center rounded-full bg-[#1a1a1a] text-white/70">
          <HugeiconsIcon icon={UserIcon} size={18} strokeWidth={1.5} />
        </span>
      )}
    </button>
  );
}

/** Panneau qui monte du bas : en-tête de compte, liens, actions. */
export function MobileSheet({
  open,
  onClose,
  header,
  items,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  header?: React.ReactNode;
  items: MobileNavItem[];
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();

  // Bloque le défilement de la page tant que le panneau est ouvert.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-[70] lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu du compte"
        className={`absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-white/[0.08] bg-[#121212] pb-[calc(16px+env(safe-area-inset-bottom))] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/15" />
        <div className="flex items-start justify-between gap-3 px-5 pt-4">
          <div className="min-w-0 flex-1">{header}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.5} />
          </button>
        </div>
        <ul className="mt-3 px-3">
          {items.map((item) => {
            const active = isMobileItemActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors ${
                    active ? "bg-[#1a1a1a] text-white" : "text-white/75 active:bg-white/[0.04]"
                  }`}
                >
                  <HugeiconsIcon icon={item.icon} size={20} strokeWidth={1.5} className="text-white/60" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        {footer ? <div className="mt-3 border-t border-white/[0.06] px-3 pt-3">{footer}</div> : null}
      </div>
    </div>
  );
}
