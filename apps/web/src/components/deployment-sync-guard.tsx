"use client";

import { useEffect } from "react";

// When Next.js is redeployed, Server Action hashes change. Clients with stale
// JS bundles call old hashes and get "Failed to find Server Action" errors.
// This guard detects that mismatch and hard-reloads to pick up the new build.
export function DeploymentSyncGuard() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message ?? String(event.reason ?? "");
      if (
        message.includes("Failed to find Server Action") ||
        message.includes("older or newer deployment")
      ) {
        event.preventDefault();
        const key = "vexonac_sa_reload";
        const last = parseInt(sessionStorage.getItem(key) ?? "0", 10);
        const now = Date.now();
        if (now - last > 30_000) {
          sessionStorage.setItem(key, String(now));
          window.location.reload();
        }
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () =>
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }, []);

  return null;
}
