"use client";

import { useState } from "react";
import { AppImage } from "@/components/media/AppImage";

type LazyCoverProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imgClassName?: string;
};

/**
 * Pochette avec placeholder shimmer jusqu’au chargement (lazy Next/Image).
 */
export function LazyCover({
  src,
  alt,
  sizes,
  className = "",
  imgClassName = "",
}: LazyCoverProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-white/[0.04] ${className}`}>
      {!loaded ? (
        <span
          aria-hidden
          className="cover-shimmer pointer-events-none absolute inset-0"
        />
      ) : null}
      <AppImage
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={`object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${imgClassName}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
