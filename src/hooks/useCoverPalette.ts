"use client";

import { useEffect, useState } from "react";

export type CoverPalette = {
  dominant: string;
  secondary: string;
  accent: string;
};

function clamp(n: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function rgb(r: number, g: number, b: number) {
  return `rgb(${clamp(r)} ${clamp(g)} ${clamp(b)})`;
}

function proxyImageUrl(src: string) {
  if (src.startsWith("/") && !src.startsWith("//")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=64&q=75`;
}

function extractPalette(img: HTMLImageElement): CoverPalette {
  const size = 40;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return {
      dominant: "rgb(40 40 48)",
      secondary: "rgb(18 18 22)",
      accent: "rgb(80 80 96)",
    };
  }

  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  let maxSat = -1;
  let accent = { r: 80, g: 80, b: 96 };

  for (let i = 0; i < data.length; i += 4) {
    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];
    const pa = data[i + 3];
    if (pa < 128) continue;

    const max = Math.max(pr, pg, pb);
    const min = Math.min(pr, pg, pb);
    const lum = (pr + pg + pb) / 3;
    if (lum < 18 || lum > 240) continue;

    r += pr;
    g += pg;
    b += pb;
    count += 1;

    const sat = max - min;
    if (sat > maxSat) {
      maxSat = sat;
      accent = { r: pr, g: pg, b: pb };
    }
  }

  if (!count) {
    return {
      dominant: "rgb(40 40 48)",
      secondary: "rgb(18 18 22)",
      accent: "rgb(80 80 96)",
    };
  }

  const dr = r / count;
  const dg = g / count;
  const db = b / count;

  return {
    dominant: rgb(dr * 0.85, dg * 0.85, db * 0.85),
    secondary: rgb(dr * 0.35, dg * 0.35, db * 0.35),
    accent: rgb(accent.r * 0.9, accent.g * 0.9, accent.b * 0.9),
  };
}

export function useCoverPalette(coverUrl: string | null | undefined) {
  const [palette, setPalette] = useState<CoverPalette | null>(null);

  useEffect(() => {
    if (!coverUrl) {
      setPalette(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.src = proxyImageUrl(coverUrl);

    img.onload = () => {
      if (cancelled) return;
      try {
        setPalette(extractPalette(img));
      } catch {
        setPalette(null);
      }
    };
    img.onerror = () => {
      if (!cancelled) setPalette(null);
    };

    return () => {
      cancelled = true;
    };
  }, [coverUrl]);

  return palette;
}
