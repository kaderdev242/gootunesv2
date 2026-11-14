import Image from "next/image";
import { images } from "@/lib/images";

export function IndependentSection() {
  return (
    <section id="independant" className="relative isolate w-full overflow-hidden bg-[#0b0b0c]">
      <Image
        src={images.guitarSpotlight}
        alt="Trois musiciennes en répétition dans un studio"
        fill
        className="-z-10 object-cover object-center grayscale"
        sizes="100vw"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(11,11,12,0.92)_0%,rgba(11,11,12,0.55)_45%,rgba(11,11,12,0.92)_100%)]" />

      <div className="mx-auto flex min-h-[640px] max-w-[1280px] flex-col justify-between gap-16 px-6 py-24 sm:px-8 lg:px-12">
        <h2 className="font-display max-w-3xl text-[40px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#ededed] sm:text-[56px]">
          L&apos;avenir de la musique est indépendant
        </h2>

        <div className="grid gap-10 sm:grid-cols-2 sm:items-end">
          <div>
            <p className="font-display max-w-md text-[32px] leading-[1.1] font-semibold tracking-[-0.02em] text-[#ededed] sm:text-[40px]">
              La plus grande part de chaque vente revient à l&apos;artiste
            </p>
          </div>
          <p className="max-w-sm text-[16px] leading-[26px] text-[#a1a1a6] sm:justify-self-end">
            Une écoute comme sur une app de streaming, une vente directe à ses fans, et le lien avec eux qui reste entre
            les mains de l&apos;artiste.
          </p>
        </div>
      </div>
    </section>
  );
}
