import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AudioWave01Icon,
  FireIcon,
  GuitarIcon,
  HeadphonesIcon,
  Mic01Icon,
  MusicNote01Icon,
  MusicNote03Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { getGenreCounts } from "@/lib/discover/queries";

const accents = ["#3B82F6", "#EAB308", "#F97316", "#22C55E", "#A855F7"];
const patterns = ["dots", "waves", "rings"] as const;

const patternStyles: Record<(typeof patterns)[number], string> = {
  dots: "radial-gradient(circle, rgb(255 255 255 / 22%) 1.2px, transparent 1.3px)",
  waves:
    "repeating-linear-gradient(90deg, transparent, transparent 8px, rgb(255 255 255 / 12%) 8px, rgb(255 255 255 / 12%) 10px)",
  rings:
    "repeating-radial-gradient(circle at center, transparent 0 10px, rgb(255 255 255 / 12%) 10px 12px)",
};

const genreIcons = [
  MusicNote01Icon,
  FireIcon,
  HeadphonesIcon,
  GuitarIcon,
  Mic01Icon,
  AudioWave01Icon,
  MusicNote03Icon,
  SparklesIcon,
];

function iconForGenre(genre: string, index: number) {
  const key = genre.toLowerCase();
  if (key.includes("afro") || key.includes("amapiano")) return FireIcon;
  if (key.includes("rumba") || key.includes("soukous") || key.includes("seben"))
    return GuitarIcon;
  if (key.includes("rap") || key.includes("drill") || key.includes("trap"))
    return Mic01Icon;
  if (key.includes("gospel") || key.includes("jazz")) return HeadphonesIcon;
  if (key.includes("coupé") || key.includes("zouglou") || key.includes("ndombolo"))
    return AudioWave01Icon;
  return genreIcons[index % genreIcons.length];
}

export async function DiscoverCards() {
  const counts = await getGenreCounts();
  const top = counts.filter((g) => g.count > 0).slice(0, 3);

  if (!top.length) return null;

  return (
    <div className="hidden gap-4 sm:grid sm:grid-cols-3">
      {top.map((item, index) => {
        const accent = accents[index % accents.length];
        const pattern = patterns[index % patterns.length];
        const icon = iconForGenre(item.genre, index);
        const href = `/discover/genres?genre=${encodeURIComponent(item.genre)}`;

        return (
          <Link
            key={item.genre}
            href={href}
            className="group relative h-[220px] overflow-hidden rounded-[28px] transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
            style={{ backgroundColor: accent }}
          >
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: patternStyles[pattern],
                backgroundSize: pattern === "dots" ? "16px 16px" : undefined,
              }}
            />

            <HugeiconsIcon
              icon={icon}
              size={180}
              className="pointer-events-none absolute -right-6 -bottom-4 text-black opacity-[0.12] transition-[filter] duration-200 group-hover:brightness-110 group-hover:opacity-[0.18]"
            />

            <div className="relative z-10 flex h-full flex-col justify-between p-5">
              <div>
                <p className="text-xs font-medium text-black/55">
                  {item.count} sortie{item.count > 1 ? "s" : ""}
                </p>
                <h3 className="font-display mt-1 text-2xl font-bold text-black">
                  {item.genre}
                </h3>
              </div>
              <p className="text-sm font-medium text-black/50 transition group-hover:text-black/70">
                Explorer →
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
