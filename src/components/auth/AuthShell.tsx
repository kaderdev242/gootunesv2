import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { images } from "@/lib/images";

/**
 * Page d'authentification : photo de scène à gauche (desktop), formulaire
 * sur fond noir à droite. Pas de carte, pas de halo : le formulaire seul.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  image = images.concertGreen,
  caption = "La musique africaine, achetée directement aux artistes",
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  image?: string;
  caption?: string;
  /** Conservé pour compatibilité, plus affiché. */
  eyebrow?: string;
}) {
  return (
    <div className="relative min-h-dvh bg-black text-white lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(480px,560px)]">
      <div className="relative hidden overflow-hidden lg:block">
        <Image src={image} alt="" fill priority className="object-cover" sizes="60vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="font-display max-w-md text-[32px] font-semibold leading-[1.15] text-white">
            {caption}
          </p>
          <p className="mt-3 max-w-sm text-[15px] text-white/60">
            Artistes, labels et fans au même endroit, paiement par Mobile Money
          </p>
        </div>
      </div>

      <div className="flex min-h-dvh flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[calc(24px+env(safe-area-inset-top))] sm:px-12">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Accueil Gootunes">
            <Logo size="md" priority />
          </Link>
          <Link href="/discover" className="text-[14px] text-white/55 transition-colors hover:text-white">
            Retour à Discover
          </Link>
        </div>

        <div className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-[400px]">
            <h1 className="font-display text-[28px] font-semibold leading-tight text-white sm:text-[32px]">
              {title}
            </h1>
            {subtitle ? <p className="mt-2 text-[15px] leading-relaxed text-white/55">{subtitle}</p> : null}
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-8 border-t border-white/[0.08] pt-6">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lien secondaire en bas de page d'authentification. */
export function AuthFooterLink({
  href,
  question,
  label,
}: {
  href: string;
  question: string;
  label: string;
}) {
  return (
    <p className="text-[14px] text-white/50">
      {question}{" "}
      <Link href={href} className="font-medium text-white underline-offset-4 hover:underline">
        {label}
      </Link>
    </p>
  );
}

