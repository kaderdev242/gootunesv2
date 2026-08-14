import Image from "next/image";
import { Card } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HeadphonesIcon,
  HeartCheckIcon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { images } from "@/lib/images";

const traits = [
  {
    icon: HeadphonesIcon,
    text: "Écoutent albums, singles et playlists chaque jour",
  },
  {
    icon: ShoppingBag01Icon,
    text: "Achètent directement via Mobile Money",
  },
  {
    icon: HeartCheckIcon,
    text: "Soutiennent les artistes — 80 % leur reviennent",
  },
];

export function BehaviorTraits() {
  return (
    <section className="w-full px-5 py-16 sm:px-8 lg:px-12">
      <div className="relative mx-auto max-w-5xl">
        <div className="absolute inset-x-6 -bottom-3 h-full rounded-[28px] bg-teal-900/80 ring-1 ring-white/5" />
        <div className="absolute inset-x-3 -bottom-1.5 h-full rounded-[28px] bg-zinc-800/90 ring-1 ring-white/5" />

        <Card className="relative overflow-hidden rounded-[28px] border-0 shadow-2xl">
          <div className="relative min-h-[420px] sm:min-h-[480px]">
            <Image
              src={images.singerRed}
              alt="Ambiance concert et communauté"
              fill
              className="object-cover"
              sizes="1024px"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-red-700/70 via-orange-700/55 to-black/50 mix-blend-multiply" />
            <div className="absolute inset-0 bg-red-600/35" />

            <div className="relative z-10 flex h-full min-h-[420px] flex-col justify-between sm:min-h-[480px]">
              <div className="flex flex-1 items-center justify-center px-6 pt-16">
                <h2 className="font-display text-center text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                  Ce que font les fans
                </h2>
              </div>

              <div className="grid grid-cols-1 divide-y divide-white/20 border-t border-white/20 bg-black/35 backdrop-blur-md sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {traits.map((trait) => (
                  <div key={trait.text} className="flex gap-3 px-5 py-5">
                    <HugeiconsIcon
                      icon={trait.icon}
                      size={20}
                      className="mt-0.5 shrink-0 text-white"
                    />
                    <p className="text-sm leading-relaxed text-white/95">
                      {trait.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
