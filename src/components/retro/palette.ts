/** Couleurs de la Rétro, tirées de la photo de profil (côté navigateur). */

export type RetroScheme = {
  bg: string;
  ink: string;
  muted: string;
  ribbonA: string;
  ribbonB: string;
  logo: "light" | "dark";
};

export type RetroPalette = {
  dark: RetroScheme;
  vivid: RetroScheme;
  light: RetroScheme;
  alt: RetroScheme;
};

const hsl = (h: number, s: number, l: number) =>
  `hsl(${Math.round(((h % 360) + 360) % 360)} ${Math.round(s)}% ${Math.round(l)}%)`;

/** Luminance relative approximative d'une couleur HSL (pour choisir texte noir ou blanc). */
function lumOf(h: number, s: number, l: number) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(0) + 0.7152 * f(8) + 0.0722 * f(4);
}

function scheme(bgH: number, bgS: number, bgL: number, rA: string, rB: string): RetroScheme {
  const darkText = lumOf(bgH, bgS, bgL) > 0.36;
  return {
    bg: hsl(bgH, bgS, bgL),
    ink: darkText ? "#050505" : "#ffffff",
    muted: darkText ? "rgba(5,5,5,0.62)" : "rgba(255,255,255,0.68)",
    ribbonA: rA,
    ribbonB: rB,
    logo: darkText ? "dark" : "light",
  };
}

export function paletteFromHue(h: number | null): RetroPalette {
  if (h === null) {
    // Photo sans couleur (ou absente) : la charte noir et blanc de Gootunes
    return {
      dark: scheme(0, 0, 2, "#f5f5f5", "#5c5c5c"),
      vivid: scheme(0, 0, 92, "#050505", "#8a8a8a"),
      light: scheme(0, 0, 100, "#050505", "#bdbdbd"),
      alt: scheme(0, 0, 14, "#ffffff", "#3a3a3a"),
    };
  }
  const h2 = h + 38;
  const h3 = h - 140;
  return {
    dark: scheme(h, 30, 4, hsl(h, 92, 58), hsl(h2, 95, 62)),
    vivid: scheme(h, 82, 50, hsl(h3, 90, 55), hsl(h2, 95, 70)),
    light: scheme(h2, 90, 74, hsl(h, 88, 48), hsl(h3, 85, 45)),
    alt: scheme(h3, 70, 42, hsl(h, 92, 60), hsl(h2, 95, 72)),
  };
}

/** Teinte dominante « vivante » d'une image (null si l'image est quasi grise). */
export async function hueFromImage(src: string): Promise<number | null> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await img.decode();
  const size = 48;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  // Histogramme des teintes pondéré par la saturation
  const bins = new Array(36).fill(0);
  let weight = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d < 0.08 || l < 0.08 || l > 0.94) continue;
    const s = d / (1 - Math.abs(2 * l - 1));
    let hue: number;
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue = (hue * 60 + 360) % 360;
    const w = s * s;
    bins[Math.floor(hue / 10) % 36] += w;
    weight += w;
  }
  if (weight < 4) return null;
  let best = 0;
  for (let i = 1; i < 36; i++) {
    const score = bins[i] + 0.5 * (bins[(i + 35) % 36] + bins[(i + 1) % 36]);
    const bestScore = bins[best] + 0.5 * (bins[(best + 35) % 36] + bins[(best + 1) % 36]);
    if (score > bestScore) best = i;
  }
  return best * 10 + 5;
}

/** Charge une image en data URL (via le proxy Next puis en direct) pour l'export JPG. */
export async function toDataUrl(src: string | null | undefined): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  const candidates = src.startsWith("/")
    ? [src]
    : [`/_next/image?url=${encodeURIComponent(src)}&w=640&q=80`, src];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) continue;
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) continue;
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch {
      // essaie la source suivante
    }
  }
  return null;
}
