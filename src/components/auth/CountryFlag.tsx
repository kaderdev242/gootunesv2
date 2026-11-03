import CG from "country-flag-icons/react/3x2/CG";
import CD from "country-flag-icons/react/3x2/CD";
import CI from "country-flag-icons/react/3x2/CI";
import CM from "country-flag-icons/react/3x2/CM";
import SN from "country-flag-icons/react/3x2/SN";
import BF from "country-flag-icons/react/3x2/BF";
import BJ from "country-flag-icons/react/3x2/BJ";
import type { CountryCode } from "@/lib/constants";

const FLAGS = {
  CG,
  CD,
  CI,
  CM,
  SN,
  BF,
  BJ,
} as const;

export function CountryFlag({
  code,
  className = "h-4 w-6",
  title,
}: {
  code: CountryCode;
  className?: string;
  title?: string;
}) {
  const Flag = FLAGS[code];
  return (
    <Flag
      title={title}
      className={`inline-block shrink-0 rounded-[2px] object-cover shadow-sm ring-1 ring-white/15 ${className}`}
      aria-hidden={!title}
    />
  );
}
