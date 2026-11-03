"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { SellMusicModal } from "./SellMusicModal";

export function AppCtaSection() {
  const router = useRouter();
  const [sellOpen, setSellOpen] = useState(false);

  return (
    <section
      id="explorer"
      className="relative w-full scroll-mt-8 overflow-hidden px-5 py-16 sm:px-8 lg:px-12"
    >
      <div className="soundwave pointer-events-none absolute inset-x-0 top-1/2 h-40 -translate-y-1/2 opacity-30" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="mx-auto w-full max-w-[420px]">
          <Image
            src="/mockup.png"
            alt="Gootunes Discover sur mobile"
            width={840}
            height={1050}
            className="h-auto w-full"
            sizes="(max-width: 1024px) 80vw, 420px"
            priority={false}
          />
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/90 p-8 sm:p-10">
          <h2 className="font-display relative text-3xl leading-tight font-bold text-white sm:text-4xl">
            Prêt à écouter — ou à vendre votre musique ?
          </h2>
          <div className="relative mt-6 space-y-4 text-sm leading-relaxed text-white/70 sm:text-base">
            <p>
              Explorez Discover comme sur une app de streaming, achetez albums
              et singles via Mobile Money, et soutenez directement les artistes
              africains.
            </p>
            <p>
              Vous créez ? Pour 990&nbsp;FCFA/an, publiez sans limite, touchez
              vos fans, et gardez 80&nbsp;% de chaque vente.
            </p>
          </div>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="h-12 rounded-full bg-white px-7 font-semibold text-black"
              onPress={() => router.push("/discover")}
            >
              Explorer Discover
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
      </div>

      <SellMusicModal isOpen={sellOpen} onOpenChange={setSellOpen} />
    </section>
  );
}
