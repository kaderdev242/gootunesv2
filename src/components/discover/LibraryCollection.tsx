"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppImage } from "@/components/media/AppImage";
import { FALLBACK_COVER } from "@/lib/types/music";

export type LibraryItemCard = {
  id: string;
  href: string;
  title: string;
  artist: string;
  cover: string;
  type: "album" | "single";
  meta: string;
};

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "album", label: "Albums" },
  { id: "single", label: "Singles" },
] as const;

export function LibraryCollection({ items }: { items: LibraryItemCard[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const visible = useMemo(
    () =>
      filter === "all" ? items : items.filter((item) => item.type === filter),
    [filter, items],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`h-9 rounded-full px-4 text-sm font-medium transition ${
                active
                  ? "bg-white text-black"
                  : "bg-white/8 text-white/70 hover:bg-white/12 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-white/35">
          {visible.length} {visible.length > 1 ? "titres" : "titre"}
        </span>
      </div>

      {visible.length === 0 ? (
        <p className="mt-16 text-sm text-white/40">
          Rien dans ce filtre pour le moment.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {visible.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="group block">
                <div className="relative aspect-square overflow-hidden rounded-md bg-zinc-900 shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/8">
                  <AppImage
                    src={item.cover || FALLBACK_COVER}
                    alt={item.title}
                    fill
                    className="object-cover transition-[filter] duration-200 group-hover:brightness-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 220px"
                  />
                </div>
                <p className="mt-3 truncate text-sm font-semibold text-white">
                  {item.title}
                </p>
                <p className="truncate text-[13px] text-white/45">
                  {item.type === "album" ? "Album" : "Single"} · {item.artist}
                </p>
                <p className="truncate text-[11px] text-white/30">{item.meta}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
