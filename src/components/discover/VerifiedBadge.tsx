/** Badge bleu de certification artiste (style plateforme). */
export function VerifiedBadge({
  className = "",
  size = 16,
  title = "Artiste certifié",
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex shrink-0 items-center justify-center align-middle text-[#1D9BF0] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 2.5c.6 0 1.1.15 1.55.42l1.16.7c.28.17.6.26.93.26h1.34c1.1 0 2 .9 2 2v1.34c0 .33.09.65.26.93l.7 1.16c.27.45.42.95.42 1.55s-.15 1.1-.42 1.55l-.7 1.16c-.17.28-.26.6-.26.93v1.34c0 1.1-.9 2-2 2h-1.34c-.33 0-.65.09-.93.26l-1.16.7c-.45.27-.95.42-1.55.42s-1.1-.15-1.55-.42l-1.16-.7a1.9 1.9 0 0 0-.93-.26H6.66c-1.1 0-2-.9-2-2v-1.34c0-.33-.09-.65-.26-.93l-.7-1.16A2.9 2.9 0 0 1 3.28 12c0-.6.15-1.1.42-1.55l.7-1.16c.17-.28.26-.6.26-.93V6.88c0-1.1.9-2 2-2h1.34c.33 0 .65-.09.93-.26l1.16-.7c.45-.27.95-.42 1.55-.42Zm-1.2 12.05 5.4-5.4-1.27-1.27-4.13 4.13-1.93-1.93-1.27 1.27 3.2 3.2Z" />
      </svg>
    </span>
  );
}

/** Nom d’artiste + badge optionnel. */
export function ArtistNameWithBadge({
  name,
  verified,
  className = "",
  badgeSize = 15,
}: {
  name: string;
  verified?: boolean;
  className?: string;
  badgeSize?: number;
}) {
  return (
    <span className={`inline-flex max-w-full items-center gap-1 ${className}`}>
      <span className="min-w-0 truncate">{name}</span>
      {verified ? <VerifiedBadge size={badgeSize} /> : null}
    </span>
  );
}
