export const MUSIC_GENRES = [
  "Rumba",
  "Ndombolo",
  "Seben",
  "Soukous",
  "Makossa",
  "Bikutsi",
  "Coupé-Décalé",
  "Zouglou",
  "Mbalax",
  "Highlife",
  "Afrobeats",
  "Afro-pop",
  "Afro-Fusion",
  "Afro-R&B",
  "Afro-Trap",
  "Afro-Drill",
  "Afro Mbokalisation",
  "Amapiano",
  "Kuduro",
  "Drill",
  "Rap (hip-hop)",
  "R&B",
  "Gospel",
  "Folklore",
  "Jazz",
  "Autres",
] as const;

export type MusicGenre = (typeof MUSIC_GENRES)[number];

export function isMusicGenre(value: string): value is MusicGenre {
  return (MUSIC_GENRES as readonly string[]).includes(value);
}

/** @deprecated use MUSIC_GENRES — alias pour compat */
export const GENRES = MUSIC_GENRES;
