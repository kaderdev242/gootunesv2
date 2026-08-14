/** Badge « E » type streaming (contenu explicite). */
export function ExplicitBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Contenu explicite"
      aria-label="Contenu explicite"
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] bg-[#5c5c5c] text-[9px] font-bold leading-none text-white ${className}`}
    >
      E
    </span>
  );
}

export function TrackArtistLine({
  artist,
  explicit,
  className = "text-xs text-white/40",
}: {
  artist: string;
  explicit?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex min-w-0 items-center gap-1.5 ${className}`}>
      {explicit ? <ExplicitBadge /> : null}
      <span className="truncate">{artist}</span>
    </span>
  );
}
