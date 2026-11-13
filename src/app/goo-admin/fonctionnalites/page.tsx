import { FEATURES, getFeatureStates } from "@/lib/features";
import { FeatureToggle } from "@/components/admin/FeatureToggle";
import { ConsoleHeader, Panel, Pill } from "@/components/admin/console/ui";

export default async function AdminFeaturesPage() {
  const states = await getFeatureStates();

  return (
    <div className="space-y-5">
      <ConsoleHeader
        title="Fonctionnalités"
        description="Les fonctionnalités exclusives. Active-les pour les rendre visibles aux artistes et aux labels, désactive-les pour les masquer."
      />

      <Panel flush>
        <ul className="-mt-4 divide-y divide-white/[0.06]">
          {states.map((s) => {
            const f = FEATURES[s.key];
            return (
              <li key={s.key} className="flex items-start gap-4 px-5 py-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-[16px] font-semibold text-white">{f.name}</p>
                    <Pill tone={s.enabled ? "ok" : "neutral"}>{s.enabled ? "Active" : "Désactivée"}</Pill>
                  </div>
                  <p className="mt-1 max-w-xl text-[14px] text-white/55">{f.description}</p>
                  <p className="mt-2 text-[12px] text-white/35">
                    Pour : {f.audience}
                    {s.updatedAt
                      ? ` · modifiée le ${new Date(s.updatedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`
                      : ""}
                  </p>
                </div>
                <FeatureToggle featureKey={s.key} name={f.name} enabled={s.enabled} />
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
