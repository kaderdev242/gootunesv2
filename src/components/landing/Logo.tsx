import Image from "next/image";

type LogoProps = {
  className?: string;
  /** `true` = logo complet, `false` = icône seule */
  showWordmark?: boolean;
  /** `dark` = logo charcoal (fonds clairs), `light` = logo clair (fonds sombres) */
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  priority?: boolean;
};

const wordmarkSizes = {
  sm: { width: 120, height: 28 },
  md: { width: 168, height: 40 },
  lg: { width: 220, height: 52 },
};

const iconSizes = {
  sm: 28,
  md: 40,
  lg: 56,
};

export function Logo({
  className = "",
  showWordmark = true,
  variant = "light",
  size = "md",
  priority = false,
}: LogoProps) {
  if (showWordmark) {
    const s = wordmarkSizes[size];
    return (
      <Image
        src={
          variant === "dark"
            ? "/logo-gootunes-dark.png"
            : "/logo-gootunes.png"
        }
        alt="Gootunes"
        width={s.width}
        height={s.height}
        priority={priority}
        className={`h-auto w-auto object-contain ${className}`}
        style={{ height: s.height, width: "auto" }}
      />
    );
  }

  const side = iconSizes[size];
  return (
    <Image
      src="/icon-gootunes.png"
      alt="Gootunes"
      width={side}
      height={side}
      priority={priority}
      className={`object-contain ${className}`}
      style={{ width: side, height: side }}
    />
  );
}
