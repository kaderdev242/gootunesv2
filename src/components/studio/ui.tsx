/**
 * Composants de l'espace artiste / label — mêmes bases visuelles que la
 * console admin (univers Discover, fond noir). Noms conservés pour les pages.
 */
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import {
  ConsoleBars,
  ConsoleEmpty,
  ConsoleHeader,
  Delta,
  Panel,
  consoleButtonClass,
  cx,
} from "@/components/admin/console/ui";

type IconType = typeof ArrowUpRight01Icon;

export function StudioPageHeader({
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
    <ConsoleHeader
      title={typeof title === "string" ? title : String(title)}
      description={description}
      actions={actions}
    />
  );
}

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
  return (
    <Link
      href={href}
      className={cx(consoleButtonClass(variant === "secondary" ? "ghost" : "primary"), className)}
    >
      {icon ? <HugeiconsIcon icon={icon} size={16} strokeWidth={1.5} /> : null}
      {children}
    </Link>
  );
}

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
    <section
      className={cx(
        "overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f0f10]",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function StudioCardHeader({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: IconType;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-[16px] font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-0.5 truncate text-[13px] text-white/45">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StudioChip({ children }: { children: React.ReactNode; tone?: string }) {
  return <span className="font-mono text-[12px] text-white/40">{children}</span>;
}

export function DeltaPill({ value }: { value: number; suffix?: string; onDark?: boolean }) {
  return <Delta value={value} />;
}

export function StatCard({
  label,
  value,
  hint,
  delta,
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
  return (
    <div className={cx("rounded-2xl border border-white/[0.06] bg-[#0f0f10] px-5 py-4", className)}>
      <p className="text-[13px] text-white/50">{label}</p>
      <p
        className={cx(
          "mt-2 truncate text-[26px] font-semibold leading-none tabular-nums",
          tone === "accent" ? "text-violet-300" : "text-white",
        )}
      >
        {value}
      </p>
      <div className="mt-2 min-h-[16px] text-[12px] text-white/45">
        {delta !== undefined ? <Delta value={delta} label="vs 30 j précédents" /> : hint}
      </div>
    </div>
  );
}

export function StudioBars({
  bars,
  format,
  height = 180,
}: {
  bars: { key?: string; label: string; value: number }[];
  format: (n: number) => string;
  height?: number;
}) {
  return <ConsoleBars bars={bars} format={format} height={height} />;
}

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
    <div className="rounded-xl border border-dashed border-white/[0.1]">
      <ConsoleEmpty title={title} hint={description} />
      {action ? <div className="-mt-6 flex justify-center pb-8">{action}</div> : null}
    </div>
  );
}

export { Panel };
