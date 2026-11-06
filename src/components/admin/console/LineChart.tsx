"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";

type Point = { key: string; value: number };

const W = 1000;

/** Courbe monotone (pas de dépassement sous zéro entre deux points). */
function smoothPath(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n === 0) return "";
  if (n === 1) return `M${xs[0]},${ys[0]}`;
  const dx = xs.map((x, i) => (i < n - 1 ? xs[i + 1] - x : 0));
  const slope = ys.map((y, i) => (i < n - 1 ? (ys[i + 1] - y) / dx[i] : 0));
  const m = ys.map((_, i) => {
    if (i === 0) return slope[0];
    if (i === n - 1) return slope[n - 2];
    if (slope[i - 1] * slope[i] <= 0) return 0;
    return (slope[i - 1] + slope[i]) / 2;
  });
  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const c1x = xs[i] + dx[i] / 3;
    const c1y = ys[i] + (m[i] * dx[i]) / 3;
    const c2x = xs[i + 1] - dx[i] / 3;
    const c2y = ys[i + 1] - (m[i + 1] * dx[i]) / 3;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${xs[i + 1]},${ys[i + 1]}`;
  }
  return d;
}

function dayLabel(key: string) {
  return new Date(`${key}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

/** Graphique principal : une seule courbe, grille discrète, valeur au survol. */
export function LineChart({
  points,
  country = null,
  height = 280,
}: {
  points: Point[];
  /** Pays pour la devise (FCFA par défaut, FC pour la RDC). */
  country?: string | null;
  height?: number;
}) {
  const format = (n: number) => formatMoney(n, country);
  const [hover, setHover] = useState<number | null>(null);
  const H = height;
  const padTop = 16;
  const padBottom = 8;

  const geo = useMemo(() => {
    const max = Math.max(...points.map((p) => p.value), 1);
    const xs = points.map((_, i) => (points.length > 1 ? (i / (points.length - 1)) * W : W / 2));
    const ys = points.map((p) => padTop + (1 - p.value / max) * (H - padTop - padBottom));
    const line = smoothPath(xs, ys);
    const area = line ? `${line} L${W},${H} L0,${H} Z` : "";
    return { max, xs, ys, line, area };
  }, [points, H]);

  const empty = points.every((p) => p.value === 0);
  const active = hover ?? (empty ? null : points.length - 1);
  const labels = points.length
    ? [0, Math.floor((points.length - 1) / 2), points.length - 1]
    : [];

  return (
    <div className="select-none">
      <div
        className="relative"
        style={{ height: H }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          setHover(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
        }}
      >
        {/* Grille */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="border-t border-dashed border-white/[0.06]" />
          ))}
        </div>
        <span className="pointer-events-none absolute left-0 top-0 font-mono text-[11px] text-white/35">
          {format(geo.max)}
        </span>

        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="lc-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(167 139 250)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="rgb(167 139 250)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {geo.area ? <path d={geo.area} fill="url(#lc-fill)" /> : null}
          {geo.line ? (
            <path
              d={geo.line}
              fill="none"
              stroke="rgb(167 139 250)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          ) : null}
          {active !== null ? (
            <line
              x1={geo.xs[active]}
              x2={geo.xs[active]}
              y1={0}
              y2={H}
              stroke="rgba(255,255,255,0.12)"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        {active !== null && points[active] ? (
          <>
            <span
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-violet-300"
              style={{ left: `${(geo.xs[active] / W) * 100}%`, top: geo.ys[active] }}
            />
            <div
              className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-2.5 py-1.5 text-center"
              style={{
                left: `${Math.min(92, Math.max(8, (geo.xs[active] / W) * 100))}%`,
                top: Math.max(0, geo.ys[active] - 52),
              }}
            >
              <p className="text-[13px] font-medium tabular-nums text-white">{format(points[active].value)}</p>
              <p className="font-mono text-[11px] text-white/45">{dayLabel(points[active].key)}</p>
            </div>
          </>
        ) : null}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-white/35">
        {labels.map((i) => (
          <span key={i}>{points[i] ? dayLabel(points[i].key) : ""}</span>
        ))}
      </div>
      {empty ? (
        <p className="mt-3 text-[13px] text-white/40">Pas encore de vente sur cette période</p>
      ) : null}
    </div>
  );
}
