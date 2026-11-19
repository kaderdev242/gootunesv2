import type { Contract } from "@/lib/contracts/template";

/** Affichage web du contrat (mêmes données que le PDF). */
export function ContractDocument({ contract, compact = false }: { contract: Contract; compact?: boolean }) {
  return (
    <div className={compact ? "text-[13.5px] leading-relaxed text-white/70" : "text-[15px] leading-relaxed text-white/70"}>
      <p className="text-[12px] text-white/40">{contract.versionLabel}</p>
      <h2 className={`font-display mt-1 font-bold tracking-tight text-white ${compact ? "text-lg" : "text-2xl"}`}>
        {contract.title}
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[contract.platform, contract.creator].map((party) => (
          <div key={party.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-[12px] font-medium text-white/40">{party.title}</p>
            <div className="mt-1.5 space-y-0.5 break-words">
              {party.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ol className="mt-6 space-y-6">
        {contract.articles.map((article, i) => (
          <li key={article.title}>
            <h3 className={`font-semibold text-white ${compact ? "text-[14.5px]" : "text-[17px]"}`}>
              Article {i + 1} — {article.title}
            </h3>
            <div className="mt-1.5 space-y-2">
              {article.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
