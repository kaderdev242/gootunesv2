"use client";

import { useEffect, useState } from "react";
import type { CountryCode } from "@/lib/constants";
import {
  DEFAULT_COUNTRY,
  detectCountryFromBrowser,
  detectCountryFromIp,
} from "@/lib/geo";

export function useDefaultCountry() {
  const [country, setCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
  }, []);

  return { country, setCountry, ready };
}
