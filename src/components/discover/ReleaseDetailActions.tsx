import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";
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
      {!owned ? (
        <Link
          href={`/discover/release/${releaseId}/acheter`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 px-5 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
        >
          <HugeiconsIcon icon={ShoppingBag01Icon} size={16} />
          Acheter · {priceLabel}
        </Link>
      ) : null}

      <ShareButton
        compact
        title={title}
        path={`/discover/release/${releaseId}`}
      />
    </div>
  );
}
