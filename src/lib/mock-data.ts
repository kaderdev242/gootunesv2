import { images } from "./images";
import type {
  Album,
  Artist,
  DiscoverPlaylist,
  FriendActivity,
  Playlist,
  Track,
  UserProfile,
} from "./types/music";

export const currentUser: UserProfile = {
  name: "Aïcha M.",
  avatar: images.creator3,
};

export const discoverPlaylists: DiscoverPlaylist[] = [
  {
    id: "d1",
    title: "Afrobeats Hot",
    tracksCount: 28,
    cover: images.artistVs1,
    accent: "#3B82F6",
    pattern: "dots",
  },
  {
    id: "d2",
    title: "Rumba Soft",
    tracksCount: 176,
    cover: images.creator1,
    accent: "#EAB308",
    pattern: "waves",
  },
  {
    id: "d3",
    title: "Coupé Vibes",
    tracksCount: 98,
    cover: images.creator4,
    accent: "#F97316",
    pattern: "rings",
  },
];

export const recentTracks: Track[] = [
  {
    id: "t1",
    title: "Kinshasa Nights",
    artist: "Fally IP",
    album: "Sango Sessions",
    cover: images.spotlight1,
    duration: "03:42",
    durationSeconds: 222,
    genre: "Rumba",
    price: 500,
    liked: true,
  },
  {
    id: "t2",
    title: "Abidjan Flow",
    artist: "Aya N.",
    album: "Lagune",
    cover: images.spotlight2,
    duration: "02:58",
    durationSeconds: 178,
    genre: "Coupé-Décalé",
    price: 400,
  },
  {
    id: "t3",
    title: "Dakar Sunrise",
    artist: "Youssou D.",
    album: "Teranga",
    cover: images.duoMic,
    duration: "04:15",
    durationSeconds: 255,
    genre: "Afrobeats",
    price: 500,
  },
  {
    id: "t4",
    title: "Douala Bounce",
    artist: "Charlotte D.",
    album: "Makossa Now",
    cover: images.bandOutdoor,
    duration: "03:21",
    durationSeconds: 201,
    genre: "Makossa",
    price: 350,
  },
  {
    id: "t5",
    title: "Brazzaville Love",
    artist: "J.B. Mpiana",
    album: "Congo Heart",
    cover: images.liveEvent,
    duration: "05:02",
    durationSeconds: 302,
    genre: "Rumba",
    price: 600,
    liked: true,
  },
  {
    id: "t6",
    title: "Wave Money",
    artist: "Sidiki D.",
    album: "Direct Fan",
    cover: images.clubOrange,
    duration: "03:05",
    durationSeconds: 185,
    genre: "Hip-Hop",
    price: 300,
  },
];

export const trendingTracks: Track[] = [
  recentTracks[2],
  recentTracks[0],
  recentTracks[5],
  recentTracks[1],
];

export const featuredArtists: Artist[] = [
  {
    id: "a1",
    name: "Fally IP",
    avatar: images.creator2,
    genre: "Rumba",
    country: "RDC",
  },
  {
    id: "a2",
    name: "Aya N.",
    avatar: images.creator1,
    genre: "Coupé-Décalé",
    country: "Côte d'Ivoire",
  },
  {
    id: "a3",
    name: "Youssou D.",
    avatar: images.creator4,
    genre: "Afrobeats",
    country: "Sénégal",
  },
  {
    id: "a4",
    name: "Charlotte D.",
    avatar: images.creator5,
    genre: "Makossa",
    country: "Cameroun",
  },
  {
    id: "a5",
    name: "Sidiki D.",
    avatar: images.creator2,
    genre: "Hip-Hop",
    country: "Mali",
  },
];

export const featuredAlbums: Album[] = [
  {
    id: "al1",
    title: "Sango Sessions",
    artist: "Fally IP",
    cover: images.spotlight1,
    year: 2026,
    tracksCount: 12,
  },
  {
    id: "al2",
    title: "Lagune",
    artist: "Aya N.",
    cover: images.spotlight2,
    year: 2026,
    tracksCount: 9,
  },
  {
    id: "al3",
    title: "Teranga",
    artist: "Youssou D.",
    cover: images.duoMic,
    year: 2025,
    tracksCount: 11,
  },
  {
    id: "al4",
    title: "Makossa Now",
    artist: "Charlotte D.",
    cover: images.bandOutdoor,
    year: 2026,
    tracksCount: 8,
  },
];

export const recommendedTracks: Track[] = [
  recentTracks[3],
  recentTracks[4],
  recentTracks[2],
  recentTracks[0],
];

export const userPlaylists: Playlist[] = [
  { id: "p1", name: "Soirée Kin" },
  { id: "p2", name: "Route Abidjan" },
  { id: "p3", name: "Gospel Soft" },
];

export const friendActivities: FriendActivity[] = [
  {
    id: "f1",
    name: "Régina S.",
    avatar: images.creator1,
    trackTitle: "Kinshasa Nights",
    artist: "Fally IP",
    when: "Maintenant",
  },
  {
    id: "f2",
    name: "Jordan V.",
    avatar: images.creator2,
    trackTitle: "Wave Money",
    artist: "Sidiki D.",
    when: "2 h",
  },
  {
    id: "f3",
    name: "Sabrina A.",
    avatar: images.creator5,
    trackTitle: "Dakar Sunrise",
    artist: "Youssou D.",
    when: "5 h",
  },
  {
    id: "f4",
    name: "Marc T.",
    avatar: images.creator4,
    trackTitle: "Abidjan Flow",
    artist: "Aya N.",
    when: "1 j",
  },
  {
    id: "f5",
    name: "Naomi K.",
    avatar: images.portrait,
    trackTitle: "Douala Bounce",
    artist: "Charlotte D.",
    when: "2 j",
  },
];

export const nowPlayingDefault = recentTracks[0];
