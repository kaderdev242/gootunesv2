import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDownRight01Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";

type IconType = typeof ArrowUpRight01Icon;

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* ───────────── En-tête de page ───────────── */

export function StudioPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[12px] font-medium text-zinc-500">{eyebrow}</p>
        ) : null}
        <h1 className="mt-0.5 text-[28px] font-semibold leading-tight tracking-[-0.03em] text-zinc-950 sm:text-[34px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-zinc-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

/* ───────────── Boutons ───────────── */

export function StudioButton({
  href,
  children,
  variant = "primary",
  icon,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent";
  icon?: IconType;
  className?: string;
}) {
  const styles = {
    primary: "bg-zinc-950 text-white hover:bg-zinc-800",
    secondary:
      "border border-black/[0.08] bg-white text-zinc-900 hover:bg-zinc-50",
    accent: "bg-[var(--studio-accent)] text-[var(--studio-accent-ink)] hover:brightness-95",
  } as const;
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition",
        styles[variant],
        className,
      )}
    >
      {icon ? <HugeiconsIcon icon={icon} size={16} /> : null}
      {children}
    </Link>
  );
}

/* ───────────── Cartes ───────────── */

export function StudioCard({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cx("studio-card", padded && "p-5 sm:p-6", className)}>
      {children}
    </section>
  );
}

export function StudioCardHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: IconType;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-black/[0.07] text-zinc-700">
            <HugeiconsIcon icon={icon} size={18} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-zinc-950">
            {title}
          </h2>
          {subtitle ? (
            <p className="truncate text-xs text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StudioChip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "dark" | "accent" | "warning";
}) {
  const tones = {
    neutral: "border border-black/[0.08] bg-white text-zinc-700",
    dark: "bg-zinc-950 text-white",
    accent: "bg-[var(--studio-accent)] text-[var(--studio-accent-ink)]",
    warning: "bg-amber-100 text-amber-900",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ───────────── Variation ───────────── */

export function DeltaPill({
  value,
  suffix = "%",
  onDark = false,
}: {
  value: number;
  suffix?: string;
  onDark?: boolean;
}) {
  const up = value >= 0;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        onDark
          ? "bg-white/12 text-white"
          : up
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15"
            : "bg-red-50 text-red-600 ring-1 ring-red-600/15",
      )}
    >
      <HugeiconsIcon
        icon={up ? ArrowUpRight01Icon : ArrowDownRight01Icon}
        size={12}
      />
      {Math.abs(value)}
      {suffix}
    </span>
  );
}

/* ───────────── Carte chiffre ───────────── */

export function StatCard({
  label,
  value,
  hint,
  delta,
  icon,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  delta?: number;
  icon?: IconType;
  tone?: "default" | "accent" | "ink";
  className?: string;
}) {
  const base =
    tone === "accent"
      ? "studio-accent-card"
      : tone === "ink"
        ? "studio-ink-card"
        : "studio-card";
  const muted =
    tone === "accent"
      ? "text-[var(--studio-accent-ink)]/65"
      : tone === "ink"
        ? "text-white/55"
        : "text-zinc-500";
  return (
    <div className={cx(base, "flex flex-col justify-between gap-6 p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className={cx("text-[13px] font-medium", muted)}>{label}</p>
        {icon ? (
          <span
            className={cx(
              "flex size-9 shrink-0 items-center justify-center rounded-full",
              tone === "default"
                ? "border border-black/[0.07] text-zinc-600"
                : tone === "ink"
                  ? "bg-white/10 text-white"
                  : "bg-white/20",
            )}
          >
            <HugeiconsIcon icon={icon} size={16} />
          </span>
        ) : null}
      </div>
      <div>
        <p className="studio-num text-[clamp(24px,2.4vw,34px)] font-semibold leading-none">
          {value}
        </p>
        {hint !== undefined || delta !== undefined ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {delta !== undefined ? (
              <DeltaPill value={delta} onDark={tone === "ink"} />
            ) : null}
            {hint ? <span className={cx("text-xs", muted)}>{hint}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ───────────── Histogramme ───────────── */

export function StudioBars({
  bars,
  format,
  height = 180,
}: {
  bars: { key?: string; label: string; value: number }[];
  format: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const peak = bars.reduce(
    (best, b, i, arr) => (b.value > arr[best].value ? i : best),
    0,
  );
  const hasData = bars.some((b) => b.value > 0);

  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
      {bars.map((bar, i) => {
        const active = hasData && i === peak;
        const pct = Math.max(6, (bar.value / max) * 100);
        return (
          <div
            key={bar.key ?? bar.label}
            className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="relative flex w-full flex-1 items-end justify-center">
              <span
                className={cx(
                  "pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-zinc-950 px-2.5 py-1 text-[10px] font-semibold text-white transition",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
                style={{ bottom: `calc(${pct}% + 8px)` }}
              >
                {format(bar.value)}
              </span>
              <div
                className={cx(
                  "w-full max-w-[46px] rounded-[14px] transition-all",
                  active
                    ? "bg-[var(--studio-accent)] shadow-[0_8px_20px_-6px_rgba(124,58,237,0.6)]"
                    : "bg-[repeating-linear-gradient(135deg,#e4e4e0_0_6px,#ececea_6px_12px)] group-hover:bg-zinc-300",
                )}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span
              className={cx(
                "text-[11px] capitalize",
                active ? "font-semibold text-zinc-900" : "text-zinc-400",
              )}
            >
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────── Liste vide ───────────── */

export function StudioEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[22px] border border-dashed border-black/[0.1] bg-zinc-50/60 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-zinc-800">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-xs text-zinc-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
