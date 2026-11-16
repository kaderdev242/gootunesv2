"use client";

import { useId, useRef } from "react";

/**
 * Waveform réelle d'une démo (pics stockés à la publication).
 * Sans données : simple barre de progression, jamais de forme inventée.
 */
export function Waveform({
  peaks,
  progress,
  onSeek,
  height = 32,
  className = "",
  label = "Position de lecture",
}: {
  peaks: number[] | null | undefined;
  progress: number;
  onSeek?: (ratio: number) => void;
  height?: number;
  className?: string;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const clipId = `wf-${useId().replace(/:/g, "")}`;
  const ratio = Math.min(1, Math.max(0, progress || 0));

  const seekFromEvent = (clientX: number) => {
    const el = ref.current;
    if (!el || !onSeek) return;
    const r = el.getBoundingClientRect();
    onSeek(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
  };

  const common = {
    ref,
    role: "slider" as const,
    "aria-label": label,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": Math.round(ratio * 100),
    tabIndex: onSeek ? 0 : -1,
    onClick: (e: React.MouseEvent) => seekFromEvent(e.clientX),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!onSeek) return;
      if (e.key === "ArrowRight") onSeek(Math.min(1, ratio + 0.05));
      if (e.key === "ArrowLeft") onSeek(Math.max(0, ratio - 0.05));
    },
  };

  if (!peaks?.length) {
    return (
      <div {...common} className={`group flex cursor-pointer items-center ${className}`} style={{ height }}>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
          <div className="h-full bg-white/90 transition-[width] duration-150" style={{ width: `${ratio * 100}%` }} />
        </div>
      </div>
    );
  }

  const n = peaks.length;
  const gap = 0.35;
  return (
    <div {...common} className={`cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${className}`} style={{ height }}>
      <svg viewBox={`0 0 ${n} 100`} preserveAspectRatio="none" className="h-full w-full" aria-hidden>
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={ratio * n} height="100" />
          </clipPath>
        </defs>
        {peaks.map((v, i) => {
          const h = Math.max(4, v);
          return (
            <rect key={i} x={i + gap / 2} y={(100 - h) / 2} width={1 - gap} height={h} rx={0.3} fill="rgb(255 255 255 / 0.22)" />
          );
        })}
        <g clipPath={`url(#${clipId})`}>
          {peaks.map((v, i) => {
            const h = Math.max(4, v);
            return <rect key={i} x={i + gap / 2} y={(100 - h) / 2} width={1 - gap} height={h} rx={0.3} fill="rgb(255 255 255 / 0.92)" />;
          })}
        </g>
      </svg>
    </div>
  );
}
