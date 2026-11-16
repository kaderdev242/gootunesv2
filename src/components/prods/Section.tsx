import Link from "next/link";
import type { ReactNode } from "react";

export function Section({
  title,
  href,
  hrefLabel = "Tout voir",
  children,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-white">{title}</h2>
        {href ? (
          <Link href={href} className="text-sm text-white/50 transition-colors hover:text-white">
            {hrefLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
