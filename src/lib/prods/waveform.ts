/** Nombre de barres stockées pour une démo. */
export const WAVEFORM_BARS = 160;

/**
 * Pics réels d'un fichier audio (0–100), calculés dans le navigateur.
 * Renvoie null si le navigateur ne sait pas décoder le fichier.
 */
export async function computeWaveform(file: Blob, bars = WAVEFORM_BARS): Promise<number[] | null> {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
    void ctx.close();

    const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
    const block = Math.floor(buffer.length / bars);
    if (block < 1) return null;
    const step = Math.max(1, Math.floor(block / 400)); // échantillonnage : rapide même sur 5 min

    const peaks: number[] = [];
    for (let b = 0; b < bars; b++) {
      let max = 0;
      for (let i = b * block; i < (b + 1) * block; i += step) {
        for (const ch of channels) {
          const v = Math.abs(ch[i]);
          if (v > max) max = v;
        }
      }
      peaks.push(max);
    }
    const top = Math.max(...peaks) || 1;
    return peaks.map((v) => Math.max(4, Math.round((v / top) * 100)));
  } catch {
    return null;
  }
}
