import Image from "next/image";
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
    title: "Ils écoutent",
    text: "Albums, singles et playlists, chaque jour",
    tone: "border-violet-400/15 bg-violet-500/[0.07]",
    ink: "text-violet-300",
  },
  {
    icon: ShoppingBag01Icon,
    title: "Ils achètent",
    text: "Directement, en Mobile Money",
    tone: "border-violet-400/15 bg-violet-500/[0.07]",
    ink: "text-violet-300",
  },
  {
    icon: HeartCheckIcon,
    title: "Ils soutiennent",
    text: "Leur achat va directement à l'artiste",
    tone: "border-violet-400/15 bg-violet-500/[0.07]",
    ink: "text-violet-300",
  },
];

export function BehaviorTraits() {
  return (
    <section id="fans" className="w-full bg-[#0b0b0c] px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#141415]">
        <div className="relative h-[360px] sm:h-[440px]">
          <Image
            src={images.singerRed}
            alt="Un rappeur sur scène, micro en main"
            fill
            className="object-cover object-[50%_30%] grayscale"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,#141415_0%,rgba(20,20,21,0.2)_55%,rgba(20,20,21,0)_100%)]" />
          <h2 className="font-display absolute inset-x-8 bottom-8 text-[40px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#ededed] sm:text-[52px]">
            Ce que font les fans
          </h2>
        </div>
        <ul className="grid gap-3 p-3 sm:grid-cols-3">
          {traits.map((t) => (
            <li key={t.title} className={`flex gap-4 rounded-[12px] border p-6 ${t.tone}`}>
              <HugeiconsIcon icon={t.icon} size={20} strokeWidth={1.5} className={`mt-0.5 shrink-0 ${t.ink}`} />
              <div>
                <p className="text-[16px] font-medium text-[#ededed]">{t.title}</p>
                <p className="mt-1 text-[15px] leading-[24px] text-[#a1a1a6]">{t.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
