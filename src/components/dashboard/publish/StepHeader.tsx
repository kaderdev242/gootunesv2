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
              i <= step ? "bg-white" : "bg-white/15"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] font-semibold tracking-[0.18em] text-white/35 uppercase">
        Étape {step + 1} / {total}
      </p>
      <h2 className="font-display mt-1 text-2xl font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm text-white/45">{subtitle}</p>
    </div>
  );
}
