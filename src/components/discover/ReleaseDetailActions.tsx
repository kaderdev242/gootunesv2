import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBag01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { ShareButton } from "./ShareButton";

export function ReleaseDetailActions({
  releaseId,
  title,
  priceLabel,
  owned,
}: {
  releaseId: string;
  title: string;
  priceLabel: string;
  owned: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {owned ? (
        <span className="inline-flex h-12 items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-6 text-sm font-semibold text-emerald-200">
          <HugeiconsIcon icon={Tick02Icon} size={16} />
          Acheté
        </span>
      ) : (
        <Link
          href={`/discover/release/${releaseId}/acheter`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          <HugeiconsIcon icon={ShoppingBag01Icon} size={16} />
          Acheter · {priceLabel}
        </Link>
      )}

      <ShareButton title={title} path={`/discover/release/${releaseId}`} />
    </div>
  );
}
