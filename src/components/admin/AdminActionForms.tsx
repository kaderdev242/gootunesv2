"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  adminSetArtistVerified,
  adminSetCreatorPlan,
  deleteReleaseAdmin,
  setMaintenance,
  setReleaseHidden,
  setUserSuspended,
  updateReportStatus,
} from "@/lib/actions/admin";
import { hasActiveArtistPlan } from "@/lib/artist-plan";
import type { ArtistPlan, LabelPlan } from "@/lib/supabase/database.types";
import type { ActionState } from "@/lib/actions/profile";
import { useActionToast } from "@/hooks/useActionToast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { consoleButtonClass } from "@/components/admin/console/ui";

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
        className={consoleButtonClass(suspended ? "success" : "danger", "sm")}
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
        className={consoleButtonClass(hidden ? "success" : "warning", "sm")}
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
        className={consoleButtonClass("danger", "sm")}
      >
        Supprimer
      </button>
      <form ref={formRef} action={action} className="hidden">
        <input type="hidden" name="release_id" value={releaseId} />
      </form>
      <ConfirmDialog
        theme="dark"
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
      className="space-y-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
    >
      <input type="hidden" name="report_id" value={reportId} />
      <label className="block space-y-1">
        <span className="text-[11px] text-zinc-500">Statut</span>
        <select
          name="status"
          defaultValue={currentStatus}
          className="w-full rounded-lg border border-white/[0.08] bg-[#0c0c0e] px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-violet-400/40"
        >
          <option value="open">Ouvert</option>
          <option value="reviewing">En revue</option>
          <option value="resolved">Résolu</option>
          <option value="dismissed">Rejeté</option>
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] text-zinc-500">Note admin</span>
        <textarea
          name="admin_note"
          rows={2}
          className="w-full resize-none rounded-lg border border-white/[0.08] bg-[#0c0c0e] px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-violet-400/40"
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-zinc-400">

        <input type="checkbox" name="hide_release" value="true" className="accent-violet-500" />
        Masquer la release associée
      </label>
      <button
        type="submit"
        disabled={pending}
        className={consoleButtonClass("primary", "sm")}
      >
        {pending ? "…" : "Enregistrer"}
      </button>
    </form>
  );
}

function planActive(expiresAt: string | null | undefined) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() > Date.now();
}

export function CreatorPlanControls({
  userId,
  role,
  artistPlan,
  artistPlanExpiresAt,
  labelPlan,
  labelPlanExpiresAt,
}: {
  userId: string;
  role: "artist" | "label";
  artistPlan?: ArtistPlan | string | null;
  artistPlanExpiresAt?: string | null;
  labelPlan?: LabelPlan | string | null;
  labelPlanExpiresAt?: string | null;
}) {
  const [state, action, pending] = useActionState(adminSetCreatorPlan, initial);
  useActionToast(state);

  if (role === "artist") {
    const active = hasActiveArtistPlan({
      artist_plan: artistPlan,
      artist_plan_expires_at: artistPlanExpiresAt,
    });
    return (
      <div className="flex flex-col items-start gap-1.5">
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
            active
              ? "bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/25"
              : "bg-white/[0.05] text-zinc-400 ring-1 ring-white/10"
          }`}
        >
          {active
            ? `Abo artiste · jusqu’au ${new Date(artistPlanExpiresAt!).toLocaleDateString("fr-FR")}`
            : "Sans abo artiste"}
        </span>
        <form action={action} className="flex flex-wrap items-center gap-1.5">
          <input type="hidden" name="user_id" value={userId} />
          <input type="hidden" name="kind" value="artist" />
          {active ? (
            <button
              type="submit"
              name="action"
              value="revoke"
              disabled={pending}
              className={consoleButtonClass("subtle", "sm")}
            >
              {pending ? "…" : "Révoquer"}
            </button>
          ) : (
            <button
              type="submit"
              name="action"
              value="activate"
              disabled={pending}
              className={consoleButtonClass("primary", "sm")}
            >
              {pending ? "…" : "Activer 1 an"}
            </button>
          )}
        </form>
      </div>
    );
  }

  const active =
    labelPlan !== "none" && planActive(labelPlanExpiresAt);
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span
        className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
          active
            ? "bg-sky-500/10 text-sky-300 ring-1 ring-sky-500/20"
            : "bg-white/[0.05] text-zinc-400 ring-1 ring-white/10"
        }`}
      >
        {active
          ? `Abo ${labelPlan} · jusqu’au ${new Date(labelPlanExpiresAt!).toLocaleDateString("fr-FR")}`
          : "Sans abo label"}
      </span>
      <form action={action} className="flex flex-wrap items-center gap-1.5">
        <input type="hidden" name="user_id" value={userId} />
        <input type="hidden" name="kind" value="label" />
        {active ? (
          <button
            type="submit"
            name="action"
            value="revoke"
            disabled={pending}
            className={consoleButtonClass("subtle", "sm")}
          >
            {pending ? "…" : "Révoquer"}
          </button>
        ) : (
          <>
            <select
              name="label_plan"
              defaultValue="unlimited"
              className="h-7 rounded-lg border border-white/[0.08] bg-[#0c0c0e] px-2 text-[11px] text-zinc-200"
            >
              <option value="starter">Starter</option>
              <option value="unlimited">Unlimited</option>
            </select>
            <button
              type="submit"
              name="action"
              value="activate"
              disabled={pending}
              className={consoleButtonClass("primary", "sm")}
            >
              {pending ? "…" : "Activer 1 an"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export function VerifyArtistButton({
  artistId,
  verified,
}: {
  artistId: string;
  verified: boolean;
}) {
  const [state, action, pending] = useActionState(adminSetArtistVerified, initial);
  useActionToast(state);

  return (
    <form action={action}>
      <input type="hidden" name="artist_id" value={artistId} />
      <input
        type="hidden"
        name="verified"
        value={verified ? "false" : "true"}
      />
      <button
        type="submit"
        disabled={pending}
        className={consoleButtonClass(verified ? "subtle" : "primary", "sm")}
      >
        {pending ? "…" : verified ? "Retirer badge" : "Certifier"}
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
      <label className="flex items-center gap-2.5 text-sm text-zinc-200">
        <input
          type="checkbox"
          name="enabled"
          value="true"
          defaultChecked={enabled}
          className="size-4 accent-violet-500"
        />
        Activer le mode maintenance
      </label>
      <label className="block space-y-1">
        <span className="text-xs text-zinc-500">Message affiché</span>
        <textarea
          name="message"
          defaultValue={message}
          rows={3}
          maxLength={500}
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#0c0c0e] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className={consoleButtonClass("primary")}
      >
        {pending ? "…" : "Enregistrer"}
      </button>
    </form>
  );
}
