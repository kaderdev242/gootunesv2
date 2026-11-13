import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

/** Encart d'accueil du dashboard quand la Rétro est activée. */
export function RetroTeaser({ basePath }: { basePath: string }) {
  const year = new Date().getFullYear();
  return (
    <Link
      href={`${basePath}/retro`}
      className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f10] px-5 py-4 transition-colors hover:border-white/[0.16]"
    >
      <svg aria-hidden className="pointer-events-none absolute -right-10 -top-6 h-[140%] w-[55%] opacity-40" viewBox="0 0 400 200" fill="none">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M -20 ${30 + i * 9} C 120 ${-30 + i * 9}, 240 ${150 + i * 9}, 420 ${40 + i * 5}`} stroke="white" strokeOpacity={0.06 + i * 0.02} strokeWidth={3} />
        ))}
      </svg>
      <div className="relative min-w-0">
        <p className="text-[16px] font-semibold text-white">Ta Rétro {year} est prête</p>
        <p className="mt-0.5 text-[13px] text-white/50">Tes écoutes, tes ventes et ton total, en cartes à télécharger.</p>
      </div>
      <span className="relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-medium text-black transition-transform group-active:scale-[0.97]">
        Voir
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
      </span>
    </Link>
  );
}
