import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

const links = [
  { href: "/contact", label: "Support" },
  { href: "/termes", label: "Conditions d'utilisation" },
  { href: "/confidentialite", label: "Confidentialité" },
] as const;

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#050505] text-white">
      <header className="border-b border-white/8">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" aria-label="Accueil Gootunes">
            <Logo size="sm" />
          </Link>
          <nav className="flex gap-4 text-xs text-white/45">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-white/35 uppercase">
          Légal
        </p>
        <h1 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-white/40">Dernière mise à jour : {updated}</p>

        <div className="legal-prose mt-10 space-y-8 text-[15px] leading-relaxed text-white/70">
          {children}
        </div>

        <p className="mt-14 text-sm text-white/35">
          <Link href="/" className="underline decoration-white/20 underline-offset-4 hover:text-white">
            ← Retour à Gootunes
          </Link>
        </p>
      </main>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
