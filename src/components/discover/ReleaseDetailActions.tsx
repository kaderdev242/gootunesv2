"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { ShareButton } from "./ShareButton";
import { IconAction } from "./IconAction";

/** Bouton d'achat, à côté de « Lire ». */
export function ReleaseBuyButton({
  releaseId,
  priceLabel,
  owned,
}: {
  releaseId: string;
  priceLabel: string;
  owned: boolean;
}) {
  if (owned) return null;
  return (
    <Link
      href={`/discover/release/${releaseId}/acheter`}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/[0.1] px-6 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-white/[0.16] active:scale-[0.97]"
    >
      <HugeiconsIcon icon={ShoppingBag01Icon} size={18} strokeWidth={1.75} />
      {priceLabel}
    </Link>
  );
}

/** Actions en icônes de la page sortie : crédits et partage. */
export function ReleaseDetailActions({
  releaseId,
  title,
  cover,
  hasCredits = false,
}: {
  releaseId: string;
  title: string;
  cover?: string | null;
  hasCredits?: boolean;
  /** Conservés pour compatibilité. */
  priceLabel?: string;
  owned?: boolean;
}) {
  return (
    <>
      {hasCredits ? (
        <IconAction
          icon={InformationCircleIcon}
          label="Crédits"
          onClick={() => {
            const el = document.getElementById("credits");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
            el?.querySelector("button")?.click();
          }}
        />
      ) : null}
      <ShareButton title={title} path={`/discover/release/${releaseId}`} cover={cover} />
    </>
  );
}
