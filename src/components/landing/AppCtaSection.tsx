"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SellMusicModal } from "./SellMusicModal";
import { btnPrimary, btnSecondary } from "./ui";

export function AppCtaSection() {
  const [sellOpen, setSellOpen] = useState(false);

  return (
    <section id="explorer" className="w-full scroll-mt-8 bg-[#0b0b0c] px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-12 overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#141415] lg:grid-cols-[5fr_7fr]">
        <div className="relative mx-auto w-full max-w-[360px] px-8 pt-12 lg:pb-0">
          <Image
            src="/mockup.png"
            alt="Gootunes Discover sur mobile"
            width={840}
            height={1050}
            className="h-auto w-full"
            sizes="(max-width: 1024px) 80vw, 360px"
          />
        </div>
        <div className="px-8 pb-12 lg:py-16 lg:pr-16">
          <h2 className="font-display text-[36px] leading-[1.08] font-semibold tracking-[-0.03em] text-[#ededed] sm:text-[44px]">
            Prêt à écouter, ou à vendre votre musique
          </h2>
          <p className="mt-6 max-w-md text-[17px] leading-[28px] text-[#a1a1a6]">
            Écoutez et achetez en Mobile Money, ou publiez votre musique et vendez-la à vos fans
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/" className={btnPrimary}>
              Explorer Discover
            </Link>
            <button type="button" onClick={() => setSellOpen(true)} className={btnSecondary}>
              Vendre ma musique
            </button>
          </div>
        </div>
      </div>
      <SellMusicModal isOpen={sellOpen} onOpenChange={setSellOpen} />
    </section>
  );
}
