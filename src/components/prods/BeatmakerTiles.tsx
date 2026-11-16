import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";
import { AppImage } from "@/components/media/AppImage";
import { getCountryLabel } from "@/lib/constants";
import type { Beatmaker } from "@/lib/prods/queries";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function BeatmakerAvatar({ name, src, size }: { name: string; src: string | null; size: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] font-medium text-white/70"
      style={{ width: size, height: size, fontSize: Math.round(size / 3) }}
    >
      {src ? <AppImage src={src} alt="" fill sizes={`${size}px`} className="object-cover" /> : initials(name)}
    </span>
  );
}

export function BeatmakerTiles({ beatmakers }: { beatmakers: Beatmaker[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {beatmakers.map((b) => (
        <li key={b.id}>
          <Link
            href={`/prods/p/${b.public_id}`}
            className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center transition-colors hover:bg-white/[0.05]"
          >
            <BeatmakerAvatar name={b.stage_name} src={b.avatar_url} size={80} />
            <span className="mt-4 flex max-w-full items-center gap-1 text-[15px] font-medium text-white">
              <span className="truncate">{b.stage_name}</span>
              {b.is_verified ? <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} className="shrink-0 text-white/60" /> : null}
            </span>
            <span className="mt-1 text-xs text-white/45">{b.country ? getCountryLabel(b.country) : "Beatmaker"}</span>
            <span className="mt-3 font-mono text-[11px] tabular-nums text-white/40">
              {b.beats} prod{b.beats > 1 ? "s" : ""} · {b.plays} écoute{b.plays > 1 ? "s" : ""}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
