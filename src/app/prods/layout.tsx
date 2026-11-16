import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/landing/Logo";
import { BeatPlayerProvider } from "@/components/prods/BeatPlayer";
import { getProdsAccess } from "@/lib/prods/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Prods — Instrumentaux des beatmakers africains",
    template: "%s · Gootunes Prods",
  },
  description:
    "Écoute et achète des instrumentaux en licence MP3, WAV ou stems, directement auprès des beatmakers. Paiement Mobile Money.",
};

export default async function ProdsLayout({ children }: { children: React.ReactNode }) {
  const access = await getProdsAccess();
  if (!access.allowed) notFound();

  return (
    <BeatPlayerProvider>
      <div className="min-h-dvh bg-black pb-28 text-white">
        {access.preview ? (
          <p className="bg-amber-400/15 px-4 py-2 text-center text-xs text-amber-100">
            Aperçu admin — la vitrine Prods est désactivée pour le public (Console › Fonctionnalités).
          </p>
        ) : null}
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
            <Link href="/prods" className="flex items-center gap-2.5" aria-label="Gootunes Prods — accueil">
              <Logo showWordmark={false} size="sm" />
              <span className="font-display text-[19px] font-bold tracking-[-0.02em]">
                Prods
              </span>
            </Link>
            <nav className="flex flex-1 items-center gap-1 text-sm">
              <Link href="/prods" className="rounded-full px-3 py-1.5 text-white/70 transition hover:bg-white/[0.06] hover:text-white">
                Explorer
              </Link>
              {/* <a> et non <Link> : sur prod.gootunes.com cette page redirige vers www (session). */}
              <a href="/prods/achats" className="rounded-full px-3 py-1.5 text-white/70 transition hover:bg-white/[0.06] hover:text-white">
                Mes achats
              </a>
            </nav>
            <a
              href="https://www.gootunes.com/inscription/createur"
              className="hidden h-9 items-center rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90 sm:inline-flex"
            >
              Vendre mes prods
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4">{children}</main>
        <footer className="mx-auto mt-20 flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-8 text-xs text-white/40">
          <span>Gootunes Prods · 80 % reversés aux beatmakers · Paiement Mobile Money</span>
          <span className="flex gap-4">
            <a href="https://www.gootunes.com" className="hover:text-white">Gootunes musique</a>
            <a href="https://www.gootunes.com/termes" className="hover:text-white">Conditions</a>
          </span>
        </footer>
      </div>
    </BeatPlayerProvider>
  );
}
