"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  deleteReleaseAdmin,
  setMaintenance,
  setReleaseHidden,
  setUserSuspended,
  updateReportStatus,
} from "@/lib/actions/admin";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const initial: ActionState = {};

export function SuspendUserButton({
  userId,
  suspended,
}: {
  userId: string;
  suspended: boolean;
}) {
  const [state, action, pending] = useActionState(setUserSuspended, initial);
  useActionToast(state);

  return (
    <form action={action}>
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="suspended" value={suspended ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
          suspended
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "bg-red-50 text-red-700 hover:bg-red-100"
        }`}
      >
        {pending ? "…" : suspended ? "Réactiver" : "Suspendre"}
      </button>
    </form>
  );
}

export function HideReleaseButton({
  releaseId,
  hidden,
}: {
  releaseId: string;
  hidden: boolean;
}) {
  const [state, action, pending] = useActionState(setReleaseHidden, initial);
  useActionToast(state);

  return (
    <form action={action}>
      <input type="hidden" name="release_id" value={releaseId} />
      <input type="hidden" name="hidden" value={hidden ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
          hidden
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "bg-amber-50 text-amber-800 hover:bg-amber-100"
        }`}
      >
        {pending ? "…" : hidden ? "Remettre en ligne" : "Masquer"}
      </button>
    </form>
  );
}

export function DeleteReleaseButton({
  releaseId,
  title,
}: {
  releaseId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteReleaseAdmin, initial);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state);

  useEffect(() => {
    if (state?.success) setOpen(false);
  }, [state?.success]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending || isPending}
        className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
      >
        Supprimer
      </button>
      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="release_id" value={releaseId} />
      </form>
      <ConfirmDialog
        theme="light"
        isOpen={open}
        onOpenChange={setOpen}
        title="Supprimer ce morceau ?"
        description={`Supprimer « ${title} » et tous ses titres ? Cette action est définitive.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isPending={pending || isPending}
        onConfirm={() => {
          startTransition(() => {
            formRef.current?.requestSubmit();
          });
        }}
      />
    </>
  );
}

export function ReportReviewForm({
  reportId,
  currentStatus,
}: {
  reportId: string;
  currentStatus: string;
}) {
  const [state, action, pending] = useActionState(updateReportStatus, initial);
  useActionToast(state);

  return (
    <form
      action={action}
      className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3"
    >
      <input type="hidden" name="report_id" value={reportId} />
      <label className="block space-y-1">
        <span className="text-[11px] text-zinc-400">Statut</span>
        <select
          name="status"
          defaultValue={currentStatus}
          className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800"
        >
          <option value="open">Ouvert</option>
          <option value="reviewing">En revue</option>
          <option value="resolved">Résolu</option>
          <option value="dismissed">Rejeté</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] text-zinc-400">Note admin</span>
        <textarea
          name="admin_note"
          rows={2}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-800"
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-zinc-500">
        <input type="checkbox" name="hide_release" value="true" />
        Masquer la release associée
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "…" : "Enregistrer"}
      </button>
    </form>
  );
}

export function MaintenanceForm({
  enabled,
  message,
}: {
  enabled: boolean;
  message: string;
}) {
  const [state, action, pending] = useActionState(setMaintenance, initial);
  useActionToast(state);

  return (
    <form action={action} className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="enabled"
          value="true"
          defaultChecked={enabled}
          className="size-4 rounded border-zinc-300"
        />
        Activer le mode maintenance
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-zinc-400">Message affiché</span>
        <textarea
          name="message"
          defaultValue={message}
          rows={3}
          maxLength={500}
          className="w-full resize-none rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "…" : "Enregistrer"}
      </button>
    </form>
  );
}
