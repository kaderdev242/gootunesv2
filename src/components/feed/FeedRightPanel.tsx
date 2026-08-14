"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification03Icon } from "@hugeicons/core-free-icons";
import { formatRelativeShort } from "@/lib/format";
import { FALLBACK_COVER, type RecentPlay } from "@/lib/types/music";
import type { Profile } from "@/lib/supabase/database.types";
import { usePlayer } from "./PlayerProvider";

export function FeedRightPanel({
  profile,
  recentPlays,
}: {
  profile: Profile | null;
  recentPlays: RecentPlay[];
}) {
  const { playTrack } = usePlayer();
  const name =
    profile?.display_name?.trim() ||
    profile?.email?.split("@")[0] ||
    "Fan";
  const avatar = profile?.avatar_url || FALLBACK_COVER;

  return (
    <aside className="scrollbar-thin hidden w-[280px] shrink-0 flex-col border-l border-white/5 bg-[#0b0b0b] xl:flex">
      <div className="flex items-center justify-between px-5 py-5">
        {profile ? (
          <div className="flex min-w-0 items-center gap-2 rounded-full py-1 pr-2 pl-1">
            <Avatar className="size-9 ring-1 ring-white/15">
              <Avatar.Image src={avatar} alt={name} />
              <Avatar.Fallback>{name.slice(0, 1).toUpperCase()}</Avatar.Fallback>
            </Avatar>
            <span className="truncate text-sm font-medium text-white">{name}</span>
          </div>
        ) : (
          <Link
            href="/connexion?next=/discover"
            className="text-sm font-medium text-white/70 transition hover:text-white"
          >
            Se connecter
          </Link>
        )}
        <button
          type="button"
          className="relative grid size-9 place-items-center rounded-full text-white/70 transition hover:bg-white/5"
          aria-label="Notifications"
        >
          <HugeiconsIcon icon={Notification03Icon} size={18} />
        </button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-5 pb-6">
        <h3 className="mb-4 text-base font-semibold text-white">
          Écouter récemment
        </h3>

        {!profile ? (
          <p className="text-sm text-white/40">
            Connecte-toi pour retrouver tes dernières écoutes.
          </p>
        ) : recentPlays.length === 0 ? (
          <p className="text-sm text-white/40">
            Tes écoutes apparaîtront ici dès que tu lances un titre.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {recentPlays.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => playTrack(item.track)}
                className="flex w-full items-start gap-3 rounded-2xl px-1 py-2 text-left transition hover:bg-white/5"
              >
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                  <Image
                    src={item.track.cover || FALLBACK_COVER}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-white">
                      {item.track.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-white/35">
                      {formatRelativeShort(item.playedAt)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-white/45">
                    {item.track.artist}
                    {item.track.album ? ` · ${item.track.album}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
