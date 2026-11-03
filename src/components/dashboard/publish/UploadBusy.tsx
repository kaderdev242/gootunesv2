type UploadBusyProps = {
  label?: string;
  /** 0–100 ; affiché seulement si défini. */
  percent?: number | null;
  /** Overlay sombre (ex. sur cover). */
  overlay?: boolean;
  className?: string;
};

/** Indicateur d’upload cover / audio (spinner + label / %). */
export function UploadBusy({
  label,
  percent,
  overlay = false,
  className = "",
}: UploadBusyProps) {
  const showPercent =
    typeof percent === "number" && Number.isFinite(percent) && percent >= 0;
  const pct = showPercent ? Math.min(100, Math.round(percent)) : null;

  const body = (
    <div
      className={`flex flex-col items-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="size-5 shrink-0 animate-spin rounded-full border-2 border-black/20 border-t-white"
        aria-hidden
      />
      {label || pct != null ? (
        <span className="text-center text-xs text-zinc-600">
          {label}
          {label && pct != null ? " · " : null}
          {pct != null ? `${pct} %` : null}
        </span>
      ) : null}
    </div>
  );

  if (!overlay) return body;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/55">
      {body}
    </div>
  );
}
