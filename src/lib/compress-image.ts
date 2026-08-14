/** Compression image navigateur (canvas) — avatars & covers avant upload R2. */

export type CompressKind = "avatar" | "cover";

const PRESETS: Record<
  CompressKind,
  { maxSide: number; quality: number; maxInputBytes: number }
> = {
  avatar: { maxSide: 800, quality: 0.82, maxInputBytes: 12 * 1024 * 1024 },
  cover: { maxSide: 1600, quality: 0.85, maxInputBytes: 12 * 1024 * 1024 },
};

function toJpegName(name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base.replace(/[^a-zA-Z0-9._-]/g, "_")}.jpg`;
}

/**
 * Redimensionne + encode en JPEG pour réduire le poids.
 * Ignore les GIF (animation). Si la compression n’aide pas, renvoie l’original.
 */
export async function compressImageFile(
  file: File,
  kind: CompressKind,
): Promise<File> {
  const preset = PRESETS[kind];
  if (file.size > preset.maxInputBytes) {
    throw new Error("Image trop volumineuse (max 12 Mo avant compression).");
  }

  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type === "image/gif" || name.endsWith(".gif")) {
    return file;
  }

  if (typeof createImageBitmap !== "function") {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const scale = Math.min(
      1,
      preset.maxSide / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    // Déjà petit et léger : pas la peine de recompresser
    if (scale === 1 && file.size <= 350 * 1024 && type === "image/jpeg") {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", preset.quality);
    });

    if (!blob) return file;

    // Garder l’original s’il est plus léger (ex. WebP déjà optimisé)
    if (blob.size >= file.size && scale === 1) {
      return file;
    }

    return new File([blob], toJpegName(file.name), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
