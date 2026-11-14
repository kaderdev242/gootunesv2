import Image from "next/image";
import { images } from "@/lib/images";

const photos = [
  { src: images.studioSession, alt: "Portrait d'artiste de profil", className: "row-span-2" },
  { src: images.bandOutdoor, alt: "Un chanteur enregistre au micro", className: "" },
  { src: images.portrait, alt: "Un artiste devant un mur de graffitis", className: "" },
  { src: images.festivalCrowd, alt: "Un artiste éclate de rire", className: "col-span-2" },
];

export function MovementSection() {
  return (
    <section id="mouvement" className="w-full bg-[#0b0b0c] px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-[5fr_7fr]">
        <h2 className="font-display text-[40px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#ededed] sm:text-[56px]">
          Faites partie du prochain grand mouvement musical
        </h2>

        <div className="grid h-[520px] grid-cols-3 grid-rows-2 gap-3 sm:h-[600px]">
          {photos.map((p) => (
            <div key={p.alt} className={`relative overflow-hidden rounded-[16px] border border-white/[0.08] ${p.className}`}>
              <Image src={p.src} alt={p.alt} fill className="object-cover grayscale" sizes="(max-width: 1024px) 50vw, 25vw" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
