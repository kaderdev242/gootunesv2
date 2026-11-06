/**
 * Kit visuel des dashboards (admin, artiste, label) — univers Discover.
 * Fond noir, cartes graphite à fine bordure, bouton principal blanc,
 * violet réservé à l'essentiel (sélection, morceau en cours, chiffre clé).
 * Inspiré de la méthode « unslop » de Damir Sokolovsky (@heydamir), CC BY 4.0.
 */
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

type IconType = typeof Search01Icon;

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ─────────────── Tableaux ─────────────── */

export const T = {
  wrap: "overflow-x-auto",
  table: "w-full text-left text-[14px]",
  thead: "text-[12px] text-white/40",
  th: "px-4 pb-2 pt-1 font-normal first:pl-5 last:pr-5",
  tr: "border-t border-white/[0.06] transition-colors hover:bg-white/[0.02]",
  td: "px-4 py-3 align-middle first:pl-5 last:pr-5",
  strong: "font-medium text-white",
  sub: "text-[12px] text-white/45",
  num: "tabular-nums text-white/85",
} as const;

/* ─────────────── En-tête de page ─────────────── */

export function ConsoleHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Ancien sur-titre : ignoré (le fil d'Ariane de la barre du haut suffit). */
  kicker?: string;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-tight text-white">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[14px] text-white/50">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/* ─────────────── Boutons ─────────────── */

const BTN = {
  primary: "bg-white text-black hover:bg-white/90",
  ghost: "border border-white/[0.08] bg-[#1a1a1a] text-white hover:bg-[#222]",
  subtle: "bg-white/[0.06] text-white/80 hover:bg-white/10 hover:text-white",
  danger: "bg-white/[0.06] text-red-300 hover:bg-red-500/15",
  success: "bg-white/[0.06] text-emerald-300 hover:bg-emerald-500/15",
  warning: "bg-white/[0.06] text-amber-200 hover:bg-amber-500/15",
} as const;

export type ConsoleButtonTone = keyof typeof BTN;

export function consoleButtonClass(
  tone: ConsoleButtonTone = "ghost",
  size: "sm" | "md" = "md",
) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-[14px]",
    BTN[tone],
  );
}

export function ConsoleLink({
  href,
  children,
  tone = "ghost",
  size = "md",
  icon,
}: {
  href: string;
  children: React.ReactNode;
  tone?: ConsoleButtonTone;
  size?: "sm" | "md";
  icon?: IconType;
}) {
  return (
    <Link href={href} className={consoleButtonClass(tone, size)}>
      {icon ? <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} /> : null}
      {children}
    </Link>
  );
}

/* ─────────────── Carte ─────────────── */

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
  flush = false,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Sans marge interne (tableaux, listes pleine largeur). */
  flush?: boolean;
}) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f10]",
        className,
      )}
    >
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            {title ? <h2 className="text-[16px] font-semibold text-white">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-[13px] text-white/45">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cx(flush ? "mt-4" : "p-5", Boolean(title) && !flush && "pt-4", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

/* ─────────────── Chiffres ─────────────── */

/** Variation sobre : « +12 % vs 30 j précédents ». */
export function Delta({ value, label }: { value: number | null; label?: string }) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span className="text-[12px] tabular-nums text-white/45">
      <span className={up ? "text-emerald-400" : "text-red-400"}>
        {up ? "+" : "−"}
        {Math.abs(value)} %
      </span>
      {label ? ` ${label}` : ""}
    </span>
  );
}

/** Un chiffre : libellé, valeur, variation ou précision. Pas d'icône ni de décor. */
export function Kpi({
  label,
  value,
  sub,
  delta,
  deltaLabel = "vs 30 j précédents",
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  delta?: number | null;
  deltaLabel?: string;
  /** Chiffre clé : seule valeur en violet sur l'écran. */
  highlight?: boolean;
  /** Ancienne icône : ignorée (les chiffres se suffisent). */
  icon?: IconType;
}) {
  return (
    <div className="min-w-0 px-4 py-4 sm:px-5">
      <p className="truncate text-[13px] text-white/50">{label}</p>
      <p
        className={cx(
          "mt-2 truncate text-[20px] font-semibold leading-none tabular-nums sm:text-[26px]",
          highlight ? "text-violet-300" : "text-white",
        )}
      >
        {value}
      </p>
      <div className="mt-2 min-h-[16px]">
        {delta !== undefined && delta !== null ? (
          <Delta value={delta} label={deltaLabel} />
        ) : sub ? (
          <span className="text-[12px] text-white/45">{sub}</span>
        ) : null}
      </div>
    </div>
  );
}

/** Bande de chiffres : une seule carte découpée en cellules. */
export function KpiGrid({
  children,
  cols = 4,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 5;
}) {
  const map = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "grid-cols-2 xl:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 xl:grid-cols-5",
  } as const;
  return (
    <div
      className={cx(
        "grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] [&>*]:bg-[#0f0f10]",
        map[cols],
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────── Statuts ─────────────── */

const DOT = {
  ok: "bg-emerald-400",
  warn: "bg-amber-400",
  danger: "bg-red-400",
  violet: "bg-violet-400",
  info: "bg-sky-400",
  neutral: "bg-white/30",
} as const;

export type PillTone = keyof typeof DOT;

/** Statut discret : un point de couleur et le texte. */
export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  /** Conservé pour compatibilité : le point est toujours affiché. */
  dot?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-white/70">
      <span className={cx("size-1.5 shrink-0 rounded-full", DOT[tone])} />
      {children}
    </span>
  );
}

/* ─────────────── Filtres et recherche ─────────────── */

export function ConsoleSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <HugeiconsIcon
        icon={Search01Icon}
        size={16}
        strokeWidth={1.5}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-full border border-white/[0.06] bg-[#1a1a1a] pl-10 pr-4 text-[14px] text-white outline-none transition-colors placeholder:text-white/35 focus:border-white/20"
      />
    </div>
  );
}

const chip = (active: boolean) =>
  cx(
    "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors",
    active ? "bg-white text-black" : "bg-[#1a1a1a] text-white/70 hover:bg-[#222] hover:text-white",
  );

/** Filtres en pastilles, comme les genres de Discover. */
export function Segmented<V extends string>({
  value,
  onChange,
  options,
}: {
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} className={chip(active)}>
            {o.label}
            {o.count !== undefined ? (
              <span className={cx("tabular-nums", active ? "text-black/50" : "text-white/35")}>{o.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Variante en liens (filtres portés par l'URL). */
export function SegmentedLinks({
  value,
  options,
}: {
  value: string;
  options: { value: string; label: string; href: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Link key={o.value} href={o.href} className={chip(active)}>
            {o.label}
            {o.count !== undefined ? (
              <span className={cx("tabular-nums", active ? "text-black/50" : "text-white/35")}>{o.count}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
  );
}

/* ─────────────── Vide ─────────────── */

export function ConsoleEmpty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-[14px] text-white/70">{title}</p>
      {hint ? <p className="mt-1 text-[13px] text-white/40">{hint}</p> : null}
    </div>
  );
}

/* ─────────────── Initiale ─────────────── */

export function Initial({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cx(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-[13px] font-medium text-white/70",
        className,
      )}
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

/* ─────────────── Histogramme sobre ─────────────── */

/** Barres neutres ; seule la plus haute porte le violet. */
export function ConsoleBars({
  bars,
  format,
  height = 170,
}: {
  bars: { key?: string; label: string; value: number }[];
  format: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const peak = bars.reduce((best, b, i, arr) => (b.value > arr[best].value ? i : best), 0);
  const hasData = bars.some((b) => b.value > 0);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {bars.map((b, i) => {
        const active = hasData && i === peak;
        const pct = Math.max(3, (b.value / max) * 100);
        return (
          <div key={b.key ?? b.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2" title={format(b.value)}>
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className={cx(
                  "w-full max-w-[28px] rounded-[4px] transition-colors",
                  active ? "bg-violet-400" : "bg-white/[0.12] group-hover:bg-white/25",
                )}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-white/40">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────── Classement avec pochettes ─────────────── */

export function RankBar({ value, max, lead }: { value: number; max: number; lead?: boolean }) {
  return (
    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className={cx("h-full rounded-full", lead ? "bg-violet-400" : "bg-white/25")}
        style={{ width: `${Math.max(3, (value / Math.max(max, 1)) * 100)}%` }}
      />
    </div>
  );
}
