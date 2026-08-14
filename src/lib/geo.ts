import { COUNTRIES, type CountryCode } from "@/lib/constants";

const TIMEZONE_TO_COUNTRY: Record<string, CountryCode> = {
  "Africa/Brazzaville": "CG",
  "Africa/Kinshasa": "CD",
  "Africa/Lubumbashi": "CD",
  "Africa/Abidjan": "CI",
  "Africa/Douala": "CM",
  "Africa/Dakar": "SN",
};

const LANG_TO_COUNTRY: Record<string, CountryCode> = {
  CG: "CG",
  CD: "CD",
  CI: "CI",
  CM: "CM",
  SN: "SN",
};

export function isCountryCode(value: string): value is CountryCode {
  return COUNTRIES.some((c) => c.code === value);
}

export function detectCountryFromBrowser(): CountryCode | null {
  if (typeof navigator === "undefined") return null;

  const locales = [navigator.language, ...(navigator.languages || [])];
  for (const locale of locales) {
    const region = locale.split("-")[1]?.toUpperCase();
    if (region && LANG_TO_COUNTRY[region]) return LANG_TO_COUNTRY[region];
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) return TIMEZONE_TO_COUNTRY[tz];
  } catch {
    // ignore
  }

  return null;
}

export async function detectCountryFromIp(): Promise<CountryCode | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { country_code?: string };
    const code = data.country_code?.toUpperCase();
    if (code && isCountryCode(code)) return code;
  } catch {
    // ignore
  }
  return null;
}

export const DEFAULT_COUNTRY: CountryCode = "CG";
