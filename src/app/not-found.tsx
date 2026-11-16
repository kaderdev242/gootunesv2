import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#0b0b0c] px-6 text-white">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center">
        <Link href="/" className="opacity-90 transition-opacity hover:opacity-100" aria-label="Gootunes — accueil">
          <Logo size="sm" priority />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-10 py-12 md:flex-row md:gap-16">
        {/* L'illustration a des traits noirs : elle repose sur un disque clair pour rester lisible. */}
        <div className="relative size-64 shrink-0 rounded-full bg-[#f4efe6] sm:size-80">
          <Image
            src="/illustrations/Boombox.png"
            alt="Un poste radio qui a perdu son haut-parleur"
            fill
            sizes="320px"
            priority
            className="object-contain p-4"
          />
        </div>

        <div className="max-w-md text-center md:text-left">
          <p className="font-mono text-[13px] text-white/40">Erreur 404</p>
          <h1 className="mt-3 font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[44px]">
            Cette piste s&apos;est perdue
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/55">
            L&apos;adresse n&apos;existe pas, a été déplacée ou le lien est incomplet. Repars de l&apos;accueil ou
            retrouve le catalogue.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2 md:justify-start">
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-lg bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-white/90"
            >
              Accueil
            </Link>
            <Link
              href="/discover/catalogue"
              className="inline-flex h-11 items-center rounded-lg border border-white/[0.12] px-5 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
            >
              Voir le catalogue
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
