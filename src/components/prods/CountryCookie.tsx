"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { detectCountryFromBrowser } from "@/lib/geo";

/**
 * Visiteur non connecté : détecte son pays (fuseau horaire, langue) et le garde un an
 * dans un cookie, pour afficher les prix dans sa devise (RDC → Franc congolais).
 */
export function CountryCookie({ known }: { known: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (known) return;
    const country = detectCountryFromBrowser();
    if (!country) return;
    document.cookie = `gt_country=${country}; path=/; max-age=31536000; samesite=lax`;
    if (country === "CD") router.refresh();
  }, [known, router]);
  return null;
}
