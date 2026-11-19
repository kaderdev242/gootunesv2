import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { SiteFooter } from "@/components/landing/SiteFooter";

/** Blog : espace éditorial indépendant de l'interface Discover (pas de barre latérale ni de lecteur). */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#0b0b0c] text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0b0b0c]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" aria-label="Accueil Gootunes" className="shrink-0">
              <Logo size="sm" />
            </Link>
            <span className="h-5 w-px bg-white/15" />
            <Link href="/blog" className="text-[15px] font-medium text-white/80 transition hover:text-white">
              Blog
            </Link>
          </div>
          <Link
            href="/"
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-black transition hover:bg-white/90"
          >
            Écouter sur Gootunes
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-10 sm:px-8 sm:pt-14">{children}</main>
      <SiteFooter />
    </div>
  );
}
