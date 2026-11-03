"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { reportClientError } from "@/lib/system-log-client";

export function SystemErrorReporter() {
  const pathname = usePathname();

  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportClientError({
        source: "window",
        message: event.message || "window.onerror",
        stack: event.error instanceof Error ? event.error.stack : null,
        path: pathname || window.location.pathname,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "unhandledrejection";
      reportClientError({
        source: "promise",
        message,
        stack: reason instanceof Error ? reason.stack : null,
        path: pathname || window.location.pathname,
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [pathname]);

  return null;
}
