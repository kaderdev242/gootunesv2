import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

/**
 * Page d'authentification épurée : logo, une colonne centrée sur fond noir,
 * un seul lien secondaire en bas.
 */
export function AuthShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-black px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[calc(48px+env(safe-area-inset-top))] text-white">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col">
        <Link href="/discover" aria-label="Gootunes" className="mx-auto">
          <Logo size="md" priority />
        </Link>
        <div className="mt-16 sm:mt-20">{children}</div>
      </div>
      {footer ? <div className="mx-auto mt-12 w-full max-w-[400px] text-center">{footer}</div> : null}
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
