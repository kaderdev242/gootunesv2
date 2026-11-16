import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

const MAIN = "https://www.gootunes.com";

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: "Explorer",
    links: [
      { label: "Toutes les prods", href: "/prods" },
      { label: "En tendance", href: "/prods?tri=populaire" },
      { label: "Beatmakers", href: "/prods/beatmakers" },
      { label: "Mes achats", href: "/prods/achats", external: true },
    ],
  },
  {
    title: "Beatmakers",
    links: [
      { label: "Vendre mes prods", href: `${MAIN}/inscription/createur`, external: true },
      { label: "Se connecter", href: `${MAIN}/connexion`, external: true },
      { label: "Mon espace", href: `${MAIN}/artist/publications`, external: true },
    ],
  },
  {
    title: "Gootunes",
    links: [
      { label: "Écouter de la musique", href: MAIN, external: true },
      { label: "Contact", href: `${MAIN}/contact`, external: true },
      { label: "Conditions", href: `${MAIN}/termes`, external: true },
      { label: "Confidentialité", href: `${MAIN}/confidentialite`, external: true },
    ],
  },
];

export function ProdsFooter() {
  return (
    <footer className="mt-24 border-t border-white/[0.06] bg-[#0b0b0c]">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-6">
        <div className="max-w-xs">
          <Link href="/prods" className="inline-flex items-center gap-2.5" aria-label="Gootunes Prods">
            <Logo showWordmark={false} size="sm" />
            <span className="font-display text-[18px] font-semibold tracking-[-0.01em] text-white">Prods</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Les instrumentaux des beatmakers d&apos;Afrique, en licence MP3, WAV ou stems. Paiement Mobile Money,
            fichiers sans tag livrés après achat.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-[13px] font-medium text-white">{col.title}</p>
            <ul className="mt-4 space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a href={l.href} className="text-sm text-white/50 transition-colors hover:text-white">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="text-sm text-white/50 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-white/35 md:px-6">
          <span>© {new Date().getFullYear()} Gootunes</span>
          <a href="https://www.gootunes.com" className="transition-colors hover:text-white">gootunes.com</a>
        </div>
      </div>
    </footer>
  );
}
