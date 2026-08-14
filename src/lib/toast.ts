"use client";

import { toast } from "@heroui/react";
import { toUserError } from "@/lib/errors";

type ToastAction = {
  label: string;
  href: string;
};

function actionProps(action?: ToastAction) {
  if (!action) return undefined;
  return {
    children: action.label,
    onPress: () => {
      window.location.href = action.href;
    },
  };
}

export function toastSuccess(
  title: string,
  description?: string,
  action?: ToastAction,
) {
  toast.success(title, {
    description,
    timeout: action ? 8000 : 4000,
    actionProps: actionProps(action),
  });
}

export function toastError(
  title: string,
  description?: string,
  action?: ToastAction,
) {
  toast.danger(title, {
    description,
    timeout: action ? 10000 : 5000,
    actionProps: actionProps(action),
  });
}

export function toastInfo(title: string, description?: string) {
  toast.info(title, {
    description,
    timeout: 4000,
  });
}

export function toastFromAction(state: {
  error?: string;
  success?: string;
  actionHref?: string;
  actionLabel?: string;
} | null) {
  if (!state) return;
  if (state.error) {
    toastError(
      toUserError(state.error),
      undefined,
      state.actionHref
        ? {
            href: state.actionHref,
            label: state.actionLabel || "Continuer",
          }
        : undefined,
    );
  } else if (state.success) {
    toastSuccess(
      state.success,
      undefined,
      state.actionHref
        ? {
            href: state.actionHref,
            label: state.actionLabel || "Continuer",
          }
        : undefined,
    );
  }
}
