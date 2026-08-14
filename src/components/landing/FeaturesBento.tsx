"use client";

import Image from "next/image";
import { Card, Chip } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkBadge01Icon,
  Location01Icon,
  MusicNote01Icon,
  SmileIcon,
} from "@hugeicons/core-free-icons";
import { Logo } from "./Logo";
import { images } from "@/lib/images";

export function FeaturesBento() {
  return (
    <section className="w-full px-5 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3 lg:grid-rows-2 lg:gap-5">
        {/* Left column */}
        <div className="flex flex-col gap-4 lg:gap-5">
          <Card className="glass-panel overflow-hidden rounded-[28px] border-white/10 bg-ink-elevated/80 p-5">
            <Card.Header className="items-center pb-3">
              <Card.Title className="font-display w-full text-center text-lg text-white">
                Une communauté qui réagit
              </Card.Title>
            </Card.Header>
            <Card.Content className="relative mx-auto aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-2xl">
              <Image
                src={images.communityReact}
                alt="Fan qui réagit à la musique"
                fill
                className="object-cover object-top"
                sizes="260px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <div className="absolute top-1/3 left-2 max-w-[85%] rounded-full bg-black/70 px-3 py-1.5 text-[11px] text-white backdrop-blur-md ring-1 ring-white/15">
                Amina K. : Vibes irréelles !
              </div>
              <div className="absolute right-3 bottom-4 rounded-full bg-white px-3 py-1 text-[10px] font-bold tracking-wide text-black shadow-lg">
                NOUVEAUTÉ
              </div>
            </Card.Content>
          </Card>

          <Card className="glass-panel overflow-hidden rounded-[28px] border-white/10 bg-ink-elevated/80 p-5">
            <Card.Header className="items-center pb-3">
              <Card.Title className="font-display w-full text-center text-lg text-white">
                Vendez directement à vos fans
              </Card.Title>
            </Card.Header>
            <Card.Content className="relative mx-auto aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-2xl sm:aspect-[16/11] sm:max-w-[280px]">
              <Image
                src={images.sellToFans}
                alt="Fan qui écoute et achète sur mobile"
                fill
                className="object-cover object-[center_20%]"
                sizes="280px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    Midnight Kin
                  </p>
                  <p className="truncate text-[10px] text-white/60">
                    Single · Awa S.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-black">
                    1 500 F
                  </span>
                  <span className="text-[10px] font-medium text-white/70">
                    Mobile Money
                  </span>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Center highlight */}
        <Card className="violet-card relative overflow-hidden rounded-[28px] border border-white/10 p-8 lg:row-span-2">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="line-grid absolute inset-0" />
            <div className="dot-grid absolute inset-0" />
          </div>
          <Card.Content className="relative flex h-full min-h-[420px] flex-col items-center justify-center gap-10 text-center lg:min-h-full">
            <div className="-mt-4">
              <Logo showWordmark={false} size="lg" />
            </div>
            <p className="font-display max-w-xs text-xl leading-snug font-semibold text-white sm:text-2xl">
              Gootunes, c&apos;est le streaming pensé pour la musique
              indépendante africaine — et pour les artistes qui veulent
              vraiment vivre de leur art.
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-white/70 sm:text-base">
              Découvrez des albums et singles, achetez en un clic via Mobile
              Money, et reversez 80&nbsp;% directement aux créateurs.
            </p>
          </Card.Content>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-4 lg:gap-5">
          <Card className="violet-card relative flex-1 overflow-hidden rounded-[28px] border border-white/10 p-5">
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <div className="line-grid absolute inset-0" />
            </div>
            <Card.Header className="relative items-center pb-2">
              <Card.Title className="font-display w-full text-center text-lg text-white">
                Explorez par genre & région
              </Card.Title>
            </Card.Header>
            <Card.Content className="relative flex flex-col items-center gap-5">
              <div className="relative mt-2 grid size-48 place-items-center sm:size-56">
                <div className="absolute size-44 rounded-full border border-white/10 sm:size-52" />
                <div className="absolute size-32 rounded-full border border-white/10 sm:size-40" />
                <div className="absolute size-20 rounded-full border border-white/15 sm:size-28" />
                <div className="relative size-20 overflow-hidden rounded-full ring-2 ring-white/40 sm:size-24">
                  <Image
                    src={images.portrait}
                    alt="Fan"
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <Chip className="absolute top-2 left-0 bg-white/10 text-xs text-white backdrop-blur">
                  Afrobeats
                </Chip>
                <Chip className="absolute top-10 right-0 bg-white/10 text-xs text-white backdrop-blur">
                  Rumba
                </Chip>
                <span className="absolute bottom-8 left-1 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[11px] text-white ring-1 ring-white/10">
                  <HugeiconsIcon
                    icon={Location01Icon}
                    size={12}
                    className="text-white"
                  />
                  Kinshasa
                </span>
                <span className="absolute right-2 bottom-14 grid size-7 place-items-center rounded-full bg-white text-black shadow">
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} />
                </span>
                <span className="absolute bottom-2 left-1/2 grid size-7 -translate-x-1/2 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/30">
                  <HugeiconsIcon icon={MusicNote01Icon} size={14} />
                </span>
                <span className="absolute top-16 left-2 text-yellow-300">
                  <HugeiconsIcon icon={SmileIcon} size={18} />
                </span>
              </div>
              <p className="max-w-[260px] text-center text-sm leading-relaxed text-white/70">
                Afrobeats, rumba, coupé-décalé, makossa… trouvez la musique
                qui vous parle, près de chez vous ou partout en Afrique.
              </p>
            </Card.Content>
          </Card>

          <Card className="violet-card relative overflow-hidden rounded-[28px] border border-white/10 p-5 sm:p-6">
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <div className="line-grid absolute inset-0" />
            </div>
            <Card.Header className="relative items-center pb-2">
              <Card.Title className="font-display w-full text-center text-base text-white sm:text-lg">
                Stats claires pour les artistes
              </Card.Title>
            </Card.Header>
            <Card.Content className="relative mt-3 flex flex-col gap-4">
              <div className="flex items-end justify-between gap-3 px-1">
                <div>
                  <p className="text-[11px] tracking-wide text-white/45 uppercase">
                    Ventes · 7j
                  </p>
                  <p className="font-display mt-0.5 text-2xl font-bold text-white sm:text-3xl">
                    +128%
                  </p>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/25">
                  En hausse
                </span>
              </div>

              <div
                className="flex h-24 items-end justify-between gap-1.5 px-0.5 sm:h-28 sm:gap-2"
                aria-hidden
              >
                {[40, 65, 45, 80, 55, 90, 70, 48, 75].map((h, i) => (
                  <div
                    key={i}
                    className="min-w-0 flex-1 rounded-full bg-gradient-to-t from-violet-500/35 via-violet-300/70 to-white"
                    style={{ height: `${Math.round((h / 100) * 96)}px` }}
                  />
                ))}
              </div>

              <div className="flex justify-between px-0.5 text-[10px] tracking-wide text-white/35 uppercase sm:text-[11px]">
                {[
                  "Lun",
                  "Mar",
                  "Mer",
                  "Jeu",
                  "Ven",
                  "Sam",
                  "Dim",
                  "Lun",
                  "Mar",
                ].map((d, i) => (
                  <span
                    key={`${d}-${i}`}
                    className="min-w-0 flex-1 text-center"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </section>
  );
}
