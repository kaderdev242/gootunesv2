export function StepHeader({
  step,
  total,
  title,
  subtitle,
}: {
  step: number;
  total: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <div className="mb-4 flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= step ? "bg-violet-400" : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className="text-[12px] font-medium text-white/40">
        Étape {step + 1} / {total}
      </p>
      <h2 className="studio-num mt-1 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-white/50">{subtitle}</p>
    </div>
  );
}
