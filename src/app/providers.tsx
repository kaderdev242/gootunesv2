"use client";

import { Toast } from "@heroui/react";
import { SystemErrorReporter } from "@/components/analytics/SystemErrorReporter";
import { PwaRegister } from "@/components/pwa/PwaRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toast.Provider placement="top" />
      <SystemErrorReporter />
      <PwaRegister />
      {children}
    </>
  );
}
