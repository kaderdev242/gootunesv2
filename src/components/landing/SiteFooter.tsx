import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="w-full px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
        <Logo size="sm" />
        <div className="flex flex-col items-center gap-2 sm:items-end">
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/45">
            <Link href="/termes" className="transition hover:text-white">
              Conditions d&apos;utilisation
            </Link>
            <Link
              href="/confidentialite"
              className="transition hover:text-white"
            >
              Confidentialité
            </Link>
          </nav>
          <p className="text-center text-xs text-white/40 sm:text-right">
            © {new Date().getFullYear()} Gootunes — Marketplace Direct-to-Fan ·
            Afrique
          </p>
        </div>
      </div>
    </footer>
  );
}
