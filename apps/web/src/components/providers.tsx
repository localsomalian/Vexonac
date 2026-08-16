"use client";

import { I18nProviderClient } from "@/locales/client";
import { queryClient } from "@/utils/trpc";
import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { AuthProvider } from "./auth-provider";
import { DeploymentSyncGuard } from "./deployment-sync-guard";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

export default function Providers(
  props: PropsWithChildren<{ locale: string }>
) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider requireAuth={false}>
          <I18nProviderClient locale={props.locale}>
            <DeploymentSyncGuard />
            {props.children}
          </I18nProviderClient>
        </AuthProvider>
      </QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
