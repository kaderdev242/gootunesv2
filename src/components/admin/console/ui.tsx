import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDownRight01Icon,
  ArrowUpRight01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

type IconType = typeof Search01Icon;

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ─────────────── Classes de tableau partagées ─────────────── */

export const T = {
  wrap: "overflow-x-auto",
  table: "w-full text-left text-[13px]",
  thead: "text-[11px] uppercase tracking-[0.08em] text-zinc-500",
  th: "px-4 py-2.5 font-medium first:pl-5 last:pr-5",
  tr: "border-t border-white/[0.05] transition-colors hover:bg-white/[0.025]",
  td: "px-4 py-3 align-middle first:pl-5 last:pr-5",
  strong: "font-medium text-zinc-100",
  sub: "text-[11px] text-zinc-500",
  num: "tabular-nums text-zinc-200",
} as const;

/* ─────────────── En-tête de page ─────────────── */

export function ConsoleHeader({
  title,
  description,
  actions,
  kicker,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  kicker?: string;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker ? (
          <p className="mb-1.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-violet-300/80">
            <span className="size-1.5 rounded-full bg-violet-400" />
            {kicker}
          </p>
        ) : null}
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-white sm:text-[30px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

/* ─────────────── Boutons ─────────────── */

const BTN = {
  primary:
    "bg-violet-600 text-white shadow-[0_0_0_1px_rgba(167,139,250,0.35),0_8px_24px_-8px_rgba(124,58,237,0.7)] hover:bg-violet-500",
  ghost:
    "border border-white/[0.08] bg-white/[0.03] text-zinc-200 hover:border-white/15 hover:bg-white/[0.06]",
  danger: "bg-red-500/10 text-red-300 ring-1 ring-red-500/20 hover:bg-red-500/20",
  success:
    "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20 hover:bg-emerald-500/20",
  warning:
    "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20 hover:bg-amber-500/20",
  subtle: "bg-white/[0.05] text-zinc-300 hover:bg-white/10 hover:text-white",
} as const;

export type ConsoleButtonTone = keyof typeof BTN;

export function consoleButtonClass(
  tone: ConsoleButtonTone = "ghost",
  size: "sm" | "md" = "md",
) {
  return cx(
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-9 px-3.5 text-[13px]",
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
      {icon ? <HugeiconsIcon icon={icon} size={size === "sm" ? 13 : 15} /> : null}
      {children}
    </Link>
  );
}

/* ─────────────── Panneau ─────────────── */

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
  /** Sans marge interne (tableaux). */
  flush?: boolean;
}) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111113]",
        className,
      )}
    >
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
          <div className="min-w-0">
            {title ? (
              <h2 className="truncate text-[14px] font-semibold text-zinc-100">{title}</h2>
            ) : null}
            {subtitle ? <p className="truncate text-xs text-zinc-500">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cx(flush ? "mt-3" : "p-5", Boolean(title) && !flush && "pt-4", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

/* ─────────────── Indicateurs ─────────────── */

export function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        up ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300",
      )}
    >
      <HugeiconsIcon icon={up ? ArrowUpRight01Icon : ArrowDownRight01Icon} size={11} />
      {Math.abs(value)}%
    </span>
  );
}

export function Kpi({
  label,
  value,
  sub,
  delta,
  icon,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  delta?: number;
  icon?: IconType;
  highlight?: boolean;
}) {
  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border p-4",
        highlight
          ? "border-violet-400/25 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(139,92,246,0.28),transparent_60%),#141018]"
          : "border-white/[0.06] bg-[#111113]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[12px] text-zinc-400">
          {icon ? (
            <HugeiconsIcon
              icon={icon}
              size={14}
              className={highlight ? "text-violet-300" : "text-zinc-500"}
            />
          ) : null}
          {label}
        </p>
        {delta !== undefined ? <Delta value={delta} /> : null}
      </div>
      <p className="mt-3 text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-white">
        {value}
      </p>
      {sub ? <p className="mt-1 text-[11px] text-zinc-500">{sub}</p> : null}
    </div>
  );
}

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
    4: "sm:grid-cols-2 xl:grid-cols-4",
    5: "sm:grid-cols-3 xl:grid-cols-5",
  } as const;
  return <div className={cx("grid gap-3", map[cols])}>{children}</div>;
}

/* ─────────────── Pastilles ─────────────── */

const PILL = {
  ok: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  danger: "bg-red-500/10 text-red-300 ring-red-500/20",
  violet: "bg-violet-500/15 text-violet-200 ring-violet-400/25",
  info: "bg-sky-500/10 text-sky-300 ring-sky-500/20",
  neutral: "bg-white/[0.05] text-zinc-300 ring-white/10",
} as const;

export type PillTone = keyof typeof PILL;

export function Pill({
  tone = "neutral",
  children,
  dot = false,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium ring-1",
        PILL[tone],
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

/* ─────────────── Barre d'outils ─────────────── */

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
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-white/[0.07] bg-white/[0.03] pl-9 pr-3 text-[13px] text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-violet-400/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-500/15"
      />
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="inline-flex flex-wrap gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cx(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition",
              active
                ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                : "text-zinc-400 hover:text-zinc-100",
            )}
          >
            {o.label}
            {o.count !== undefined ? (
              <span
                className={cx(
                  "rounded px-1 text-[10px] tabular-nums",
                  active ? "bg-violet-500/30 text-violet-100" : "text-zinc-500",
                )}
              >
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Variante en liens (filtres côté serveur via l'URL). */
export function SegmentedLinks({
  value,
  options,
}: {
  value: string;
  options: { value: string; label: string; href: string; count?: number }[];
}) {
  return (
    <div className="inline-flex flex-wrap gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Link
            key={o.value}
            href={o.href}
            className={cx(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition",
              active
                ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                : "text-zinc-400 hover:text-zinc-100",
            )}
          >
            {o.label}
            {o.count !== undefined ? (
              <span className="text-[10px] tabular-nums text-zinc-500">{o.count}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
    </div>
  );
}

/* ─────────────── États vides ─────────────── */

export function ConsoleEmpty({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-3 size-8 rounded-full border border-dashed border-white/15" />
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

/* ─────────────── Avatar initiale ─────────────── */

export function Initial({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cx(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/30 to-violet-900/30 text-[12px] font-semibold text-violet-100 ring-1 ring-violet-400/20",
        className,
      )}
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

/* ─────────────── Mini histogramme ─────────────── */

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
    <div className="relative" style={{ height }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="border-t border-dashed border-white/[0.05]" />
        ))}
      </div>
      <div className="relative flex h-full items-end gap-2">
        {bars.map((b, i) => {
          const active = hasData && i === peak;
          const pct = Math.max(4, (b.value / max) * 100);
          return (
            <div key={b.key ?? b.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="relative flex w-full flex-1 items-end justify-center">
                <span
                  className={cx(
                    "pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-violet-500 px-1.5 py-0.5 text-[10px] font-semibold text-white transition",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                  )}
                  style={{ bottom: `calc(${pct}% + 6px)` }}
                >
                  {format(b.value)}
                </span>
                <div
                  className={cx(
                    "w-full max-w-[34px] rounded-t-md transition-all",
                    active
                      ? "bg-gradient-to-t from-violet-700 to-violet-400 shadow-[0_0_24px_-4px_rgba(139,92,246,0.7)]"
                      : "bg-white/[0.08] group-hover:bg-white/15",
                  )}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className={cx("text-[10px] capitalize", active ? "text-zinc-200" : "text-zinc-500")}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
