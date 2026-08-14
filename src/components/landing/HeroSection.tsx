"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Logo } from "./Logo";
import { SellMusicModal } from "./SellMusicModal";
import { images } from "@/lib/images";

export function HeroSection() {
  const router = useRouter();
  const [sellOpen, setSellOpen] = useState(false);

  return (
    <section className="violet-wash relative min-h-dvh w-full overflow-hidden px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="line-grid absolute inset-0 opacity-70" />
        <div className="dot-grid absolute inset-0 opacity-50" />
      </div>

      <div className="relative z-10 mx-auto flex h-full min-h-[calc(100dvh-6rem)] max-w-6xl flex-col items-center justify-center text-center">
        <Logo className="animate-rise-in" size="lg" priority />

        <h1 className="animate-rise-in-delay-1 font-display mt-10 max-w-4xl text-4xl leading-[1.05] font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          La musique africaine, entre artistes et fans.
        </h1>

        <div className="animate-rise-in-delay-2 perspective-1200 relative mt-12 flex w-full max-w-3xl items-center justify-center gap-3 sm:gap-6">
          <div className="animate-float-soft w-[42%] max-w-[280px]">
            <div
              className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15 sm:rounded-3xl"
              style={{ transform: "rotateY(18deg) rotateZ(-6deg)" }}
            >
              <Image
                src={images.concertGreen}
                alt="Concert live sous lumières vertes"
                fill
                className="object-cover"
                sizes="280px"
                priority
              />
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 z-0 aspect-[3/4] w-[28%] -translate-x-1/2 -translate-y-[58%] rotate-2 overflow-hidden rounded-2xl opacity-50 ring-1 ring-white/10">
            <Image
              src={images.festivalCrowd}
              alt=""
              fill
              className="object-cover"
              sizes="180px"
            />
          </div>
          <div className="animate-float-soft relative z-10 w-[42%] max-w-[280px] [animation-delay:0.8s]">
            <div
              className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15 sm:rounded-3xl"
              style={{ transform: "rotateY(-18deg) rotateZ(6deg)" }}
            >
              <Image
                src={images.clubOrange}
                alt="Ambiance club et scène"
                fill
                className="object-cover"
                sizes="280px"
                priority
              />
            </div>
          </div>
        </div>

        <p className="mt-10 max-w-xl text-sm leading-relaxed tracking-wide text-white/80 sm:text-base">
          Gootunes, c&apos;est là où musique, culture et communauté se rencontrent —
          et où les artistes africains vendent directement à leurs fans.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="h-12 rounded-full bg-white px-7 font-semibold text-black"
            onPress={() => router.push("/discover")}
          >
            Explorer la musique
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-white/30 bg-transparent px-7 font-semibold text-white"
            onPress={() => setSellOpen(true)}
          >
            Vendre ma musique
          </Button>
        </div>
      </div>

      <SellMusicModal isOpen={sellOpen} onOpenChange={setSellOpen} />
    </section>
  );
}
