import type { PaymentStatus } from "@/lib/supabase/database.types";
import { Pill, type PillTone } from "@/components/admin/console/ui";

const LABELS: Record<PaymentStatus, string> = {
  completed: "Succès",
  pending: "En attente",
  failed: "Échec",
  cancelled: "Annulé",
};

const TONES: Record<PaymentStatus, PillTone> = {
  completed: "ok",
  pending: "warn",
  failed: "danger",
  cancelled: "neutral",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus | string }) {
  const key = status as PaymentStatus;
  return (
    <Pill tone={TONES[key] ?? "neutral"} dot>
      {LABELS[key] || status}
    </Pill>
  );
}
