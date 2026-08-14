import Image from "next/image";
import { images } from "@/lib/images";

const collage = [
  {
    src: images.studioSession,
    alt: "Session studio",
    className: "left-[8%] top-[8%] w-[38%] rotate-[-8deg]",
  },
  {
    src: images.bandOutdoor,
    alt: "Groupe en live",
    className: "right-[6%] top-[4%] w-[40%] rotate-[7deg]",
  },
  {
    src: images.duoMic,
    alt: "Duo au micro",
    className: "bottom-[18%] left-[18%] z-10 w-[36%] rotate-[-3deg]",
  },
  {
    src: images.festivalCrowd,
    alt: "Foule festival",
    className: "right-[12%] bottom-[12%] w-[34%] rotate-[5deg]",
  },
];

export function MovementSection() {
  return (
    <section className="violet-wash relative w-full overflow-hidden px-5 py-16 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="line-grid absolute inset-0" />
        <div className="dot-grid absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[520px] max-w-7xl items-center gap-8 lg:grid-cols-2">
        <div className="flex items-center justify-center text-center lg:justify-start lg:text-left">
          <h2 className="font-display text-4xl leading-[1.05] font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Faites partie du
            <br />
            prochain grand
            <br />
            mouvement musical
          </h2>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-lg">
          {collage.map((item) => (
            <div
              key={item.alt}
              className={`absolute aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/15 ${item.className}`}
            >
              <Image src={item.src} alt={item.alt} fill className="object-cover" sizes="240px" />
            </div>
          ))}

          <div className="absolute top-1/2 left-1/2 z-20 size-20 -translate-x-1/2 -translate-y-[10%] rounded-full bg-[conic-gradient(from_180deg,silver,white,#94a3b8,silver)] shadow-xl ring-4 ring-black/40 sm:size-24" />
          <div className="absolute top-[58%] left-[58%] z-20 size-16 rounded-full bg-[conic-gradient(from_90deg,#fbbf24,#fde68a,#f59e0b,#fbbf24)] shadow-xl ring-4 ring-black/40 sm:size-20" />

          <div className="absolute top-[42%] left-[4%] z-10 flex aspect-[3/4] w-[28%] rotate-[-12deg] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-3 shadow-xl ring-1 ring-white/20">
            <span className="font-display text-center text-[10px] font-bold tracking-wider text-white uppercase sm:text-xs">
              Soirée
              <br />
              Afrobeats
            </span>
          </div>

          <div className="absolute right-[2%] bottom-[38%] z-10 flex aspect-square w-[26%] rotate-[10deg] items-end justify-center overflow-hidden rounded-2xl bg-gradient-to-t from-pink-600 to-rose-300 p-3 shadow-xl ring-1 ring-white/20">
            <span className="font-display text-[10px] font-bold tracking-wider text-white uppercase">
              Nouvelle sortie
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
