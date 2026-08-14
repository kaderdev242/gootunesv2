"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Bouton icône natif — évite le warning PressResponder de HeroUI + Hugeicons. */
export function IconButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40 ${className}`}
      {...props}
    >
      <span className="inline-flex">{children}</span>
    </button>
  );
}
