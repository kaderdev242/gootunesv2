/**
 * Signature Gootunes : trois barres d'égaliseur, uniquement sur le morceau
 * en cours de lecture (ligne de liste, player, carte). Figé si `paused`.
 */
export function NowPlayingBars({
  paused = false,
  className = "",
}: {
  paused?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-label={paused ? "En pause" : "En cours de lecture"}
      role="img"
      className={`inline-flex h-3 items-end gap-[2px] text-violet-300 ${paused ? "now-playing-paused" : ""} ${className}`}
    >
      <span className="now-playing-bar h-full w-[3px] rounded-[1px] bg-current" />
      <span className="now-playing-bar h-full w-[3px] rounded-[1px] bg-current [animation-delay:-320ms]" />
      <span className="now-playing-bar h-full w-[3px] rounded-[1px] bg-current [animation-delay:-640ms]" />
    </span>
  );
}
