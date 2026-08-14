import type { PaymentStatus } from "@/lib/supabase/database.types";

const LABELS: Record<PaymentStatus, string> = {
  completed: "Succès",
  pending: "En attente",
  failed: "Échec",
  cancelled: "Annulé",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus | string }) {
  const key = status as PaymentStatus;
  const label = LABELS[key] || status;

  const tone =
    key === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : key === "pending"
        ? "bg-amber-50 text-amber-800"
        : key === "failed" || key === "cancelled"
          ? "bg-red-50 text-red-700"
          : "bg-zinc-100 text-zinc-600";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}
