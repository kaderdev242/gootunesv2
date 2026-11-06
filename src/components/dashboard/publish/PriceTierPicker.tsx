"use client";

import { RELEASE_PRICE_TIERS } from "@/lib/purchases/apple-tiers";
import { formatMoney } from "@/lib/format";

export function PriceTierPicker({
  valueFcfa,
  onChange,
  country,
}: {
  valueFcfa: number;
  onChange: (priceFcfa: number) => void;
  country?: string | null;
}) {
  return (
    <select
      value={valueFcfa}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-12 rounded-2xl border border-white/10 bg-[#0f0f10] px-3 text-sm text-white"
    >
      {RELEASE_PRICE_TIERS.map((tier) => (
        <option key={tier.sku} value={tier.priceFcfa} className="bg-[#121212] text-white">
          {formatMoney(tier.priceFcfa, country)}
        </option>
      ))}
    </select>
  );
}
