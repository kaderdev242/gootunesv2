"use client";

import { AppImage } from "@/components/media/AppImage";
import { useCoverPalette } from "@/hooks/useCoverPalette";
import { FALLBACK_COVER } from "@/lib/types/music";

export function CoverAtmosphere({
  coverUrl,
  className = "",
  intensity = "page",
}: {
  coverUrl?: string | null;
  className?: string;
  /** page = fond plein viewport ; panel = carte locale */
  intensity?: "page" | "panel" | "fullscreen";
}) {
  const cover = coverUrl || FALLBACK_COVER;
  const palette = useCoverPalette(cover);

  const overlay =
    intensity === "fullscreen"
      ? "from-black/25 via-[#070707]/75 to-[#070707]"
      : intensity === "panel"
        ? "from-black/25 via-black/55 to-[#0a0a0a]/95"
        : "from-black/30 via-[#0a0a0a]/70 to-[#0a0a0a]";

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
      style={
        palette
          ? {
              background: `
                radial-gradient(ellipse 90% 70% at 20% 10%, ${palette.dominant} 0%, transparent 55%),
                radial-gradient(ellipse 80% 60% at 85% 30%, ${palette.accent} 0%, transparent 50%),
                radial-gradient(ellipse 100% 80% at 50% 100%, ${palette.secondary} 0%, #070707 70%)
              `,
            }
          : undefined
      }
    >
      <AppImage
        src={cover}
        alt=""
        fill
        className="scale-125 object-cover opacity-45 blur-3xl saturate-150"
        sizes={
          intensity === "fullscreen"
            ? "100vw"
            : intensity === "panel"
              ? "(max-width: 768px) 100vw, 720px"
              : "(max-width: 1024px) 100vw, 900px"
        }
        priority={intensity === "fullscreen"}
      />
      <div className={`absolute inset-0 bg-gradient-to-b ${overlay}`} />
    </div>
  );
}
