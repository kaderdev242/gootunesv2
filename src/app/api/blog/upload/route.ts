import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth/admin";
import { logServerError } from "@/lib/errors";
import { uploadObjectToR2 } from "@/lib/r2";

export const runtime = "nodejs";

/** Poids maximum accepté avant conversion. */
const MAX_INPUT = 15 * 1024 * 1024;

/** Largeur max après conversion : couverture plein cadre, image de contenu en colonne. */
const MAX_WIDTH = { cover: 1600, inline: 1400 } as const;

/**
 * Upload d'image du blog (admin uniquement).
 * Toute image est réencodée en WebP : redimensionnée, orientée selon l'EXIF,
 * métadonnées supprimées (GPS, appareil). Le fichier d'origine n'est jamais stocké.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const kind = form.get("kind") === "cover" ? "cover" : "inline";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
    }
    if (file.size > MAX_INPUT) {
      return NextResponse.json({ error: "Image trop lourde (15 Mo maximum)." }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());

    let output: Buffer;
    let width = 0;
    let height = 0;
    try {
      const result = await sharp(input, { limitInputPixels: 60_000_000, animated: false })
        .rotate()
        .resize({ width: MAX_WIDTH[kind], withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toBuffer({ resolveWithObject: true });
      output = result.data;
      width = result.info.width;
      height = result.info.height;
    } catch {
      return NextResponse.json(
        { error: "Format d'image non reconnu (JPEG, PNG, WebP, GIF ou AVIF)." },
        { status: 400 },
      );
    }

    const month = new Date().toISOString().slice(0, 7);
    const key = `blog/${month}/${randomUUID()}.webp`;
    const { fileUrl } = await uploadObjectToR2({ key, contentType: "image/webp", body: output });

    return NextResponse.json({
      fileUrl,
      width,
      height,
      originalBytes: file.size,
      bytes: output.length,
    });
  } catch (e) {
    logServerError("api.blog.upload", e);
    return NextResponse.json({ error: "Envoi de l'image impossible. Réessaie." }, { status: 500 });
  }
}
