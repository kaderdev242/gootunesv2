"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAptabase } from "@aptabase/react";

/** Aptabase n’envoie rien tout seul — on trace le démarrage et les pages. */
export function AptabaseTracker() {
  const { trackEvent } = useAptabase();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!started.current) {
      started.current = true;
      trackEvent("app_started", { platform: "web" });
    }
    if (pathname) {
      trackEvent("page_view", { path: pathname });
    }
  }, [ready, pathname, trackEvent]);

  return null;
}
