import Link from "next/link";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="w-full bg-[#0b0b0c] px-6 pb-12 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 border-t border-white/[0.08] pt-8 sm:flex-row sm:items-center sm:justify-between">
        <Logo size="sm" />
        <div className="flex flex-col gap-2 sm:items-end">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#a1a1a6]">
            <Link href="/termes" className="transition-colors hover:text-[#ededed]">
              Conditions d&apos;utilisation
            </Link>
            <Link href="/confidentialite" className="transition-colors hover:text-[#ededed]">
              Confidentialité
            </Link>
          </nav>
          <p className="text-[13px] text-[#85858b]">
            © {new Date().getFullYear()} Gootunes · La musique directement auprès des artistes
          </p>
        </div>
      </div>
    </footer>
  );
}
