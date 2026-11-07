"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Share08Icon } from "@hugeicons/core-free-icons";

type IconType = typeof Share08Icon;

const base =
  "group flex w-16 flex-col items-center gap-1.5 text-[12px] text-white/60 transition-colors hover:text-white";
const circle =
  "flex size-11 items-center justify-center rounded-full bg-white/[0.08] text-white transition-[background-color,transform] duration-150 group-hover:bg-white/[0.14] group-active:scale-[0.95]";

/** Action secondaire : icône ronde, libellé court dessous (Aléatoire, Crédits, Partager…). */
export function IconAction({
  icon,
  label,
  onClick,
  href,
  active = false,
}: {
  icon: IconType;
  label: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
}) {
  const inner = (
    <>
      <span className={`${circle} ${active ? "text-violet-300" : ""}`}>
        <HugeiconsIcon icon={icon} size={20} strokeWidth={1.75} />
      </span>
      <span className="truncate">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={base} aria-label={label}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={base} aria-label={label}>
      {inner}
    </button>
  );
}
