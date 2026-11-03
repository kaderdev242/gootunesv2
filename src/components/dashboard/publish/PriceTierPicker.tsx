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
      className="h-12 rounded-2xl border border-black/10 bg-white px-3 text-sm text-zinc-950"
    >
      {RELEASE_PRICE_TIERS.map((tier) => (
        <option key={tier.sku} value={tier.priceFcfa} className="bg-white text-zinc-900">
          {formatMoney(tier.priceFcfa, country)}
        </option>
      ))}
    </select>
  );
}
