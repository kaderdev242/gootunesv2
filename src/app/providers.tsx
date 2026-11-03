"use client";

import { Toast } from "@heroui/react";
import { AptabaseProvider } from "@aptabase/react";
import { AptabaseTracker } from "@/components/analytics/AptabaseTracker";
import { SystemErrorReporter } from "@/components/analytics/SystemErrorReporter";
import { PwaRegister } from "@/components/pwa/PwaRegister";

const APTABASE_APP_KEY = "A-EU-9315295344";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AptabaseProvider
      appKey={APTABASE_APP_KEY}
      options={{ appVersion: "0.1.0" }}
    >
      <Toast.Provider placement="top" />
      <AptabaseTracker />
      <SystemErrorReporter />
      <PwaRegister />
      {children}
    </AptabaseProvider>
  );
}
