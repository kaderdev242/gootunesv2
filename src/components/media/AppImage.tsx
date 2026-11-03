import Image, { type ImageProps } from "next/image";

/** Hôtes déjà dans next.config remotePatterns → optimisation Next (AVIF/WebP). */
const OPTIMIZED_HOST_RE =
  /(^|\.)(r2\.dev|r2\.cloudflarestorage\.com|cloudinary\.com|images\.unsplash\.com)$/i;

function hostnameOf(src: ImageProps["src"]): string | null {
  if (typeof src !== "string" || !/^https?:\/\//i.test(src)) return null;
  try {
    return new URL(src).hostname;
  } catch {
    return null;
  }
}

function shouldUnoptimize(src: ImageProps["src"]) {
  const host = hostnameOf(src);
  if (!host) return false;
  return !OPTIMIZED_HOST_RE.test(host);
}

/** Optimise R2 / Cloudinary ; laisse unoptimized les autres hôtes distants. */
export function AppImage({ unoptimized, ...props }: ImageProps) {
  return (
    <Image
      {...props}
      unoptimized={unoptimized ?? shouldUnoptimize(props.src)}
    />
  );
}
