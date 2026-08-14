export const COVER_SIZE = 1000;

export function isMp3File(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type === "audio/mpeg" ||
    file.type === "audio/mp3" ||
    name.endsWith(".mp3")
  );
}

/** Durée audio en secondes (navigateur). */
export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    const cleanup = () => {
      URL.revokeObjectURL(url);
      audio.removeAttribute("src");
      audio.load();
    };
    audio.onloadedmetadata = () => {
      const seconds = Math.round(audio.duration);
      cleanup();
      resolve(Number.isFinite(seconds) && seconds > 0 ? seconds : 0);
    };
    audio.onerror = () => {
      cleanup();
      resolve(0);
    };
    audio.src = url;
  });
}

export function loadImageDimensions(file: File): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire l'image"));
    };
    img.src = url;
  });
}

/** Cover obligatoire : carré exact 1000×1000 */
export async function validateCoverFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("La cover doit être une image.");
  }
  const { width, height } = await loadImageDimensions(file);
  if (width !== COVER_SIZE || height !== COVER_SIZE) {
    throw new Error(
      `Cover obligatoire en ${COVER_SIZE}×${COVER_SIZE} px (reçu ${width}×${height}).`,
    );
  }
}
