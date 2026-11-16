import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/landing/Logo";
import { BeatPlayerProvider } from "@/components/prods/BeatPlayer";
import { ProdsFooter } from "@/components/prods/ProdsFooter";
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

const navLink = "rounded-md px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white";

export default async function ProdsLayout({ children }: { children: React.ReactNode }) {
  const access = await getProdsAccess();
  if (!access.allowed) notFound();

  return (
    <BeatPlayerProvider>
      <div className="flex min-h-dvh flex-col bg-[#0b0b0c] pb-[72px] text-white">
        {access.preview ? (
          <p className="bg-amber-400/15 px-4 py-2 text-center text-xs text-amber-100">
            Aperçu admin — la vitrine Prods est désactivée pour le public (Console › Fonctionnalités)
          </p>
        ) : null}
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0b0b0c]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 md:px-6">
            <Link href="/prods" className="flex shrink-0 items-center gap-2.5" aria-label="Gootunes Prods — accueil">
              <Logo showWordmark={false} size="sm" />
              <span className="font-display text-[18px] font-semibold tracking-[-0.01em]">Prods</span>
            </Link>
            <nav className="flex flex-1 items-center gap-1">
              <Link href="/prods" className={navLink}>
                Explorer
              </Link>
              <Link href="/prods/beatmakers" className={`${navLink} hidden sm:inline-flex`}>
                Beatmakers
              </Link>
              {/* <a> et non <Link> : sur prod.gootunes.com cette page redirige vers www (session). */}
              <a href="/prods/achats" className={navLink}>
                Mes achats
              </a>
            </nav>
            <a
              href="https://www.gootunes.com/inscription/createur"
              className="hidden h-9 items-center rounded-lg bg-white px-3.5 text-sm font-medium text-black transition-colors hover:bg-white/90 sm:inline-flex"
            >
              Vendre mes prods
            </a>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 md:px-6">{children}</main>
        <ProdsFooter />
      </div>
    </BeatPlayerProvider>
  );
}
