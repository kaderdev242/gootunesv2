"use client";

import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { preloadAccess } from "./PlayerProvider";

type PreloadOnVisibleProps = HTMLAttributes<HTMLDivElement> & {
  trackId: string;
  children: ReactNode;
};

/**
 * Préchauffe `/play` dès qu’une piste entre dans le viewport
 * (scroll mobile / tactile — le hover souris ne suffit pas).
 */
export function PreloadOnVisible({
  trackId,
  children,
  onPointerEnter,
  onFocus,
  ...rest
}: PreloadOnVisibleProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void preloadAccess(trackId);
          io.disconnect();
        }
      },
      { rootMargin: "180px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trackId]);

  return (
    <div
      ref={ref}
      onPointerEnter={(e) => {
        void preloadAccess(trackId);
        onPointerEnter?.(e);
      }}
      onFocus={(e) => {
        void preloadAccess(trackId);
        onFocus?.(e);
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
