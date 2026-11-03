import { VerifiedBadge } from "@/components/discover/VerifiedBadge";

/** Badge « E » type streaming (contenu explicite). */
export function ExplicitBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Contenu explicite"
      aria-label="Contenu explicite"
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] bg-[#5c5c5c] align-middle text-[9px] font-bold leading-none text-white ${className}`}
    >
      E
    </span>
  );
}

/** Titre + badge E collé au titre (pas à l’artiste). */
export function TrackTitleLine({
  title,
  explicit,
  className = "text-sm font-medium text-white",
}: {
  title: string;
  explicit?: boolean;
  className?: string;
}) {
  return (
    <p className={`min-w-0 max-w-full ${className}`}>
      <span className="align-middle">{title}</span>
      {explicit ? (
        <>
          {" "}
          <ExplicitBadge />
        </>
      ) : null}
    </p>
  );
}

export function TrackArtistLine({
  artist,
  verified,
  className = "text-xs text-white/40",
}: {
  artist: string;
  verified?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-full min-w-0 max-w-full items-center gap-1 truncate ${className}`}
    >
      <span className="min-w-0 truncate">{artist}</span>
      {verified ? <VerifiedBadge size={13} className="shrink-0" /> : null}
    </span>
  );
}
