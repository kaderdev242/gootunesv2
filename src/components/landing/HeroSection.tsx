"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, PauseIcon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { Logo } from "./Logo";
import { SellMusicModal } from "./SellMusicModal";
import { LiveBars, btnPrimary, btnSecondary } from "./ui";
import { images } from "@/lib/images";

/** La sortie affichée dans le hero : à quoi ressemble un titre en vente sur Gootunes. */
function ReleasePreview() {
  return (
    <div className="w-full max-w-[400px] rounded-[20px] border border-white/[0.08] bg-[#141415]/95 p-3 shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[10px]">
          <Image src={images.studioSession} alt="" fill className="object-cover grayscale" sizes="72px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <LiveBars />
            <p className="truncate text-[15px] font-medium text-[#ededed]">Kinshasa la nuit</p>
          </div>
          <p className="mt-1 truncate text-[13px] text-[#a1a1a6]">Ndaya · Single · Rumba</p>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.1]">
            <div className="h-full w-[38%] rounded-full bg-[#ededed]" />
          </div>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ededed] text-[#0b0b0c]">
          <HugeiconsIcon icon={PauseIcon} size={18} strokeWidth={2} />
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-[12px] bg-white/[0.04] px-4 py-3">
        <div>
          <p className="text-[12px] text-[#85858b]">Extrait gratuit</p>
          <p className="text-[15px] font-medium text-[#ededed]">Écoute complète à l&apos;achat</p>
        </div>
        <span className="inline-flex h-9 items-center gap-2 rounded-full bg-white/[0.08] px-4 text-[13px] font-medium text-[#ededed]">
          <HugeiconsIcon icon={ShoppingBag01Icon} size={16} strokeWidth={1.5} />
          Acheter
        </span>
      </div>
    </div>
  );
}

export function HeroSection() {
  const [sellOpen, setSellOpen] = useState(false);

  return (
    <section className="relative isolate flex min-h-dvh w-full flex-col overflow-hidden bg-[#0b0b0c]">
      {/* Scène : session studio, à droite ; le texte vit sur la partie sombre à gauche */}
      <div className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[64%]">
        <Image
          src={images.studioMic}
          alt="Une chanteuse enregistre au micro, dans un studio sombre"
          fill
          priority
          className="object-cover object-[70%_30%] grayscale"
          sizes="(max-width: 1024px) 100vw, 64vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#0b0b0c_0%,rgba(11,11,12,0.6)_30%,rgba(11,11,12,0)_60%)] max-lg:bg-[linear-gradient(180deg,rgba(11,11,12,0.55)_0%,rgba(11,11,12,0.8)_55%,#0b0b0c_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(0deg,#0b0b0c,rgba(11,11,12,0))]" />
      </div>

      <header className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-6 pt-6 sm:px-8 lg:px-12">
        <Logo size="sm" priority />
        <nav className="flex items-center gap-6">
          <Link href="/" className="hidden text-[15px] text-[#a1a1a6] transition-colors hover:text-[#ededed] sm:inline">
            Écouter
          </Link>
          <Link href="/connexion" className="text-[15px] text-[#a1a1a6] transition-colors hover:text-[#ededed]">
            Se connecter
          </Link>
        </nav>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col justify-center px-6 pt-16 pb-12 sm:px-8 lg:px-12 lg:pt-8">
        <div className="animate-rise-in max-w-[600px]">
          <h1 className="font-display text-[44px] leading-[1.04] font-semibold tracking-[-0.03em] text-[#ededed] sm:text-[60px] lg:text-[72px]">
            La musique africaine, entre artistes et fans
          </h1>
          <p className="mt-6 max-w-[480px] text-[18px] leading-[30px] text-[#a1a1a6]">
            Les artistes publient leurs singles et albums. Les fans les écoutent et les achètent en Mobile Money
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/" className={btnPrimary}>
              Explorer la musique
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={1.5} />
            </Link>
            <button type="button" onClick={() => setSellOpen(true)} className={btnSecondary}>
              Vendre ma musique
            </button>
          </div>
        </div>

        <div className="animate-rise-in-delay-1 mt-16 flex lg:absolute lg:right-12 lg:bottom-12 lg:mt-0 xl:right-[max(48px,calc((100vw-1280px)/2+48px))]">
          <ReleasePreview />
        </div>
      </div>

      <SellMusicModal isOpen={sellOpen} onOpenChange={setSellOpen} />
    </section>
  );
}
