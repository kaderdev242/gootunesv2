"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

type SectionScrollerProps = {
  title: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  children: React.ReactNode;
  empty?: boolean;
  emptyLabel?: string;
  /** Largeur de scroll par clic (px). */
  scrollAmount?: number;
};

export function SectionScroller({
  title,
  seeAllHref,
  seeAllLabel = "Voir tout",
  children,
  empty = false,
  emptyLabel = "Rien à afficher pour le moment.",
  scrollAmount = 340,
}: SectionScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback(
    (dir: -1 | 1) => {
      scrollerRef.current?.scrollBy({
        left: dir * scrollAmount,
        behavior: "smooth",
      });
    },
    [scrollAmount],
  );

  return (
    <section>
      <div className="mb-4 flex items-end gap-3">
        <h2 className="font-display min-w-0 flex-1 text-2xl font-bold text-white">
          {title}
        </h2>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {seeAllHref ? (
            <Link
              href={seeAllHref}
              className="mr-1 text-sm font-medium text-white/45 transition hover:text-white"
            >
              {seeAllLabel}
            </Link>
          ) : null}
          {!empty ? (
            <>
              <button
                type="button"
                onClick={() => scroll(-1)}
                aria-label="Défiler vers la gauche"
                className="grid size-9 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                aria-label="Défiler vers la droite"
                className="grid size-9 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {empty ? (
        <p className="text-sm text-white/40">{emptyLabel}</p>
      ) : (
        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:gap-4"
        >
          {children}
        </div>
      )}
    </section>
  );
}
