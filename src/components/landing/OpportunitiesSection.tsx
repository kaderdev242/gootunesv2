import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  ShoppingBag01Icon,
  SmartPhone01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { LiveBars, SectionTitle } from "./ui";
import { images } from "@/lib/images";

/** Le parcours d'une vente, du point de vue de l'artiste. */
const steps = [
  { icon: null, title: "Un fan écoute l'extrait", meta: "Discover" },
  { icon: ShoppingBag01Icon, title: "Il achète le single", meta: "Mobile Money" },
  { icon: Wallet01Icon, title: "Ta part arrive sur ton solde", meta: "Tableau de bord" },
  { icon: SmartPhone01Icon, title: "Tu retires vers ton numéro", meta: "Mobile Money" },
];

function SaleFlow() {
  return (
    <div className="rounded-[20px] border border-white/[0.08] bg-[#141415] p-2">
      <div className="flex items-center gap-4 rounded-[12px] bg-white/[0.04] p-4">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-[8px]">
          <Image src={images.artistVs2} alt="" fill className="object-cover grayscale" sizes="56px" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-[#ededed]">Mama Na Ngai</p>
          <p className="truncate text-[13px] text-[#a1a1a6]">Single · Abidjan</p>
        </div>
      </div>

      <ol className="mt-2">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex items-center gap-4 px-4 py-4">
            {i < steps.length - 1 ? (
              <span className="absolute top-[44px] bottom-[-12px] left-[31px] w-px bg-white/[0.08]" aria-hidden />
            ) : null}
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-[#19191b] text-[#a1a1a6]">
              {s.icon ? <HugeiconsIcon icon={s.icon} size={16} strokeWidth={1.5} /> : <LiveBars />}
            </span>
            <p className="flex-1 text-[15px] text-[#ededed]">{s.title}</p>
            <span className="text-[13px] text-[#85858b]">{s.meta}</span>
          </li>
        ))}
      </ol>

      <div className="mt-2 flex items-center gap-3 rounded-[12px] border border-white/[0.08] bg-[#19191b] px-4 py-3">
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={1.5} className="text-[#4cc38a]" />
        <p className="text-[14px] text-[#ededed]">Nouvelle vente</p>
        <p className="ml-auto text-[13px] text-[#85858b]">à l&apos;instant</p>
      </div>
    </div>
  );
}

export function OpportunitiesSection() {
  return (
    <section id="vendre" className="w-full scroll-mt-8 bg-[#0b0b0c] px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Pour les artistes" title="Publiez. Vendez. Encaissez." />
          <div className="mt-8 max-w-xl space-y-5 text-[17px] leading-[28px] text-[#a1a1a6]">
            <p>
              Votre musique, vos fans, vos revenus, sans label obligatoire. Publiez vos albums et vos singles, soyez
              découverts sur Discover, et touchez la plus grande part de chaque vente.
            </p>
            <p>
              Le paiement se fait en Mobile Money, pensé pour les usages locaux : Congo, RDC, Côte d&apos;Ivoire,
              Cameroun, Sénégal, Burkina Faso et Bénin.
            </p>
          </div>
        </div>
        <SaleFlow />
      </div>
    </section>
  );
}
