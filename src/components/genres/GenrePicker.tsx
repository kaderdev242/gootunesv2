"use client";

import { useMemo, useState } from "react";
import { MUSIC_GENRES, type MusicGenre } from "@/lib/genres";

type BaseProps = {
  name?: string;
  genres?: readonly string[];
  className?: string;
  searchable?: boolean;
  label?: string;
};

type MultiProps = BaseProps & {
  mode?: "multi";
  value: string[];
  onChange: (genres: string[]) => void;
  max?: number;
};

type SingleProps = BaseProps & {
  mode: "single";
  value: string | null;
  onChange: (genre: string | null) => void;
  max?: never;
};

export type GenrePickerProps = MultiProps | SingleProps;

export function GenrePicker(props: GenrePickerProps) {
  const {
    name,
    genres = MUSIC_GENRES,
    className = "",
    searchable = true,
    label,
  } = props;
  const mode = props.mode ?? "multi";
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return genres;
    return genres.filter((g) => g.toLowerCase().includes(q));
  }, [genres, query]);

  const selectedSet = useMemo(() => {
    if (mode === "single") {
      return new Set(props.value ? [props.value] : []);
    }
    return new Set(props.value);
  }, [mode, props.value]);

  function toggle(genre: string) {
    if (mode === "single") {
      const single = props as SingleProps;
      single.onChange(single.value === genre ? null : genre);
      return;
    }
    const multi = props as MultiProps;
    const exists = multi.value.includes(genre);
    if (exists) {
      multi.onChange(multi.value.filter((g) => g !== genre));
      return;
    }
    if (multi.max && multi.value.length >= multi.max) return;
    multi.onChange([...multi.value, genre]);
  }

  const hiddenValue =
    mode === "single"
      ? (props as SingleProps).value || ""
      : (props as MultiProps).value.join(",");

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {label ? (
        <p className="text-sm font-medium text-white/70">{label}</p>
      ) : null}

      {name ? <input type="hidden" name={name} value={hiddenValue} /> : null}

      {searchable ? (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un genre…"
          className="h-11 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {filtered.map((genre) => {
          const active = selectedSet.has(genre);
          return (
            <button
              key={genre}
              type="button"
              onClick={() => toggle(genre)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-white text-black"
                  : "border border-white/12 bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white"
              }`}
            >
              {genre}
            </button>
          );
        })}
        {filtered.length === 0 ? (
          <p className="text-sm text-white/40">Aucun genre trouvé.</p>
        ) : null}
      </div>

      {mode === "multi" ? (
        <p className="text-xs text-white/35">
          {(props as MultiProps).value.length} sélectionné
          {(props as MultiProps).value.length > 1 ? "s" : ""}
          {(props as MultiProps).max
            ? ` · max ${(props as MultiProps).max}`
            : ""}
        </p>
      ) : null}
    </div>
  );
}

export function GenreChips({
  genres,
  className = "",
}: {
  genres: string[];
  className?: string;
}) {
  if (!genres.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {genres.map((g) => (
        <span
          key={g}
          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/70"
        >
          {g}
        </span>
      ))}
    </div>
  );
}

export type { MusicGenre };
