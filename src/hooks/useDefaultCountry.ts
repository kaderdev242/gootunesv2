"use client";

import { useEffect, useState } from "react";
import type { CountryCode } from "@/lib/constants";
import {
  DEFAULT_COUNTRY,
  detectCountryFromBrowser,
  detectCountryFromIp,
  isCountryCode,
} from "@/lib/geo";

/** Pays par défaut ; `initial` (ex. pays du profil) désactive la détection auto. */
export function useDefaultCountry(initial?: string | null) {
  const known = initial && isCountryCode(initial) ? initial : null;
  const [country, setCountry] = useState<CountryCode>(known ?? DEFAULT_COUNTRY);
  const [ready, setReady] = useState(Boolean(known));

  useEffect(() => {
    if (known) return;
    let cancelled = false;

    async function resolve() {
      const fromBrowser = detectCountryFromBrowser();
      if (fromBrowser && !cancelled) {
        setCountry(fromBrowser);
        setReady(true);
        return;
      }

      const fromIp = await detectCountryFromIp();
      if (!cancelled) {
        setCountry(fromIp || DEFAULT_COUNTRY);
        setReady(true);
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [known]);

  return { country, setCountry, ready };
}
