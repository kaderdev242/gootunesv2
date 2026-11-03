import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-6 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="violet-wash absolute inset-0 opacity-45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07),transparent_55%)]" />
        <div className="absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-white/[0.04] blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <Link href="/" className="mb-10 transition opacity-90 hover:opacity-100">
          <Logo size="md" priority />
        </Link>

        <p
          className="font-display select-none text-[7.5rem] leading-none font-bold tracking-tighter text-white/[0.07] sm:text-[10rem]"
          aria-hidden
        >
          404
        </p>

        <div className="-mt-8 space-y-3 sm:-mt-10">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-white/35 uppercase">
            Page introuvable
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Cette piste s&apos;est perdue
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-white/50">
            L&apos;adresse n&apos;existe pas, a été déplacée, ou le lien est
            incomplet. Retrouve le catalogue ou repars de l&apos;accueil.
          </p>
        </div>

        <div className="mt-9">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Accueil
          </Link>
        </div>

        <p className="mt-10 text-xs text-white/25">
          Code erreur · 404
        </p>
      </div>
    </div>
  );
}
