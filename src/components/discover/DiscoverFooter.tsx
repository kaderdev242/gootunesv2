import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

/** Footer Discover — liens légaux + copyright. */
export function DiscoverFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 pt-8 pb-4">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <Logo size="sm" />
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-white/40">
            Marketplace Direct-to-Fan pour la musique africaine. Achète,
            écoute, soutiens les artistes.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/45">
            <Link href="/discover" className="transition hover:text-white">
              Accueil
            </Link>
            <Link
              href="/discover/catalogue"
              className="transition hover:text-white"
            >
              Catalogue
            </Link>
            <Link href="/discover/genres" className="transition hover:text-white">
              Genres
            </Link>
            <Link href="/termes" className="transition hover:text-white">
              Conditions
            </Link>
            <Link
              href="/confidentialite"
              className="transition hover:text-white"
            >
              Confidentialité
            </Link>
          </nav>
          <p className="text-xs text-white/35">
            © {new Date().getFullYear()} Gootunes
          </p>
        </div>
      </div>
    </footer>
  );
}
