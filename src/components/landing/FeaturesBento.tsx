import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AnalyticsUpIcon,
  Compass01Icon,
  HeadphonesIcon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { SectionTitle } from "./ui";
import { images } from "@/lib/images";

const features = [
  {
    icon: HeadphonesIcon,
    title: "Écouter",
    text: "Albums, singles et playlists. Tendances, nouveautés et sélections de la semaine sur Discover.",
  },
  {
    icon: SmartPhone01Icon,
    title: "Acheter en Mobile Money",
    text: "Un extrait gratuit pour découvrir, puis un achat en un clic depuis le téléphone.",
  },
  {
    icon: Compass01Icon,
    title: "Explorer par genre et par pays",
    text: "Afrobeats, rumba, coupé-décalé, makossa. La musique de Brazzaville à Dakar.",
  },
  {
    icon: AnalyticsUpIcon,
    title: "Suivre ses chiffres",
    text: "Écoutes, ventes et revenus de chaque sortie, dans le tableau de bord artiste.",
  },
];

export function FeaturesBento() {
  return (
    <section id="fonctionnalites" className="w-full bg-[#0b0b0c] px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1280px]">
        <SectionTitle eyebrow="Gootunes" title="Le streaming pensé pour la musique indépendante africaine">
          Découvrir, acheter et soutenir les artistes au même endroit.
        </SectionTitle>

        <div className="mt-16 grid gap-6 lg:grid-cols-[5fr_7fr]">
          <figure className="relative min-h-[420px] overflow-hidden rounded-[20px] border border-white/[0.08]">
            <Image
              src={images.concertGreen}
              alt="Une fan écoute de la musique au casque, les yeux fermés"
              fill
              className="object-cover object-top grayscale"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(0deg,rgba(11,11,12,0.85),rgba(11,11,12,0))]" />
            <figcaption className="absolute inset-x-6 bottom-6 text-[15px] text-[#ededed]">
              Pour les fans qui veulent soutenir les artistes qu&apos;ils écoutent
            </figcaption>
          </figure>

          <ul className="grid rounded-[20px] border border-white/[0.08] bg-[#141415] sm:grid-cols-2">
            {features.map((f, i) => (
              <li
                key={f.title}
                className={`flex flex-col gap-4 p-8 ${i % 2 === 1 ? "sm:border-l sm:border-white/[0.08]" : ""} ${i > 1 ? "border-t border-white/[0.08]" : i === 1 ? "max-sm:border-t max-sm:border-white/[0.08]" : ""}`}
              >
                <HugeiconsIcon icon={f.icon} size={20} strokeWidth={1.5} className="text-[#85858b]" />
                <div>
                  <h3 className="text-[18px] font-medium text-[#ededed]">{f.title}</h3>
                  <p className="mt-2 text-[15px] leading-[24px] text-[#a1a1a6]">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
