import { MUSIC_GENRES } from "@/lib/genres";

export function GenreGrid({
  genres = MUSIC_GENRES,
  title,
}: {
  genres?: readonly string[];
  title?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {title ? (
        <p className="text-sm font-medium text-white/70">{title}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <span
            key={genre}
            className="rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            {genre}
          </span>
        ))}
      </div>
    </div>
  );
}
