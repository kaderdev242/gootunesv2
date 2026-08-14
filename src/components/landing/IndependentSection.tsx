import Image from "next/image";
import { images } from "@/lib/images";

export function IndependentSection() {
  return (
    <section className="relative min-h-[560px] w-full overflow-hidden sm:min-h-[640px]">
      <Image
        src={images.guitarSpotlight}
        alt="Musicien en silhouette sous un projecteur"
        fill
        className="object-cover object-center opacity-80"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,transparent_0%,rgb(0_0_0_/_55%)_55%,rgb(0_0_0_/_92%)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-[70%] w-[45%] -translate-x-1/2 bg-[linear-gradient(165deg,rgb(186_230_253_/_35%),transparent_55%)] blur-2xl" />

      <div className="relative z-10 mx-auto flex min-h-[560px] max-w-7xl flex-col justify-between px-5 py-12 sm:min-h-[640px] sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="text-center">
          <p className="font-display text-lg text-white/55 sm:text-xl">
            L&apos;avenir de la musique est
          </p>
          <h2 className="font-display mt-1 text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
            Indépendant
          </h2>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 sm:items-end">
          <div className="max-w-xs">
            <p className="font-display text-5xl font-bold text-white sm:text-6xl">
              <span className="mr-1 text-white/50">*</span>80%
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/85">
              des revenus reviennent aux artistes. Nous sommes la plateforme construite pour eux.
            </p>
          </div>
          <p className="max-w-sm justify-self-end text-sm leading-relaxed text-white/85 sm:text-right">
            Conçu comme un streaming moderne, mais bâti pour les artistes
            africains : écoute, vente Direct-to-Fan, et une vraie connexion
            avec les fans.
          </p>
        </div>
      </div>
    </section>
  );
}
