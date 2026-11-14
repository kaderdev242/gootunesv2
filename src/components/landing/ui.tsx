import { NowPlayingBars } from "@/components/discover/NowPlayingBars";

/** Petits éléments partagés de la landing : boutons, titres de section, signature. */

export const btnPrimary =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#ededed] px-6 text-[15px] font-medium text-[#0b0b0c] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white active:scale-[0.98]";

export const btnSecondary =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.06] px-6 text-[15px] font-medium text-[#ededed] transition-[background-color,border-color,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white/[0.16] hover:bg-white/[0.1] active:scale-[0.98]";

export function SectionTitle({
  eyebrow,
  title,
  children,
  align = "left",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? <p className="text-[15px] text-[#85858b]">{eyebrow}</p> : null}
      <h2 className="font-display mt-3 text-[40px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#ededed] sm:text-[52px]">
        {title}
      </h2>
      {children ? (
        <p className="mt-5 text-[18px] leading-[30px] text-[#a1a1a6]">{children}</p>
      ) : null}
    </div>
  );
}

/** Signature : l'égaliseur « en cours de lecture » de l'app. */
export function LiveBars({ className = "" }: { className?: string }) {
  return <NowPlayingBars className={className} />;
}
