"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 p-8">
      <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle className="h-7 w-7 text-red-400" />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-1">
          {error?.message || "An unexpected error occurred loading the dashboard."}
        </p>
        {error?.digest && (
          <p className="text-xs text-muted-foreground/50 font-mono mt-1">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset} size="sm" className="gap-2">
        <RefreshCw className="h-3.5 w-3.5" />
        Try again
      </Button>
    </div>
  );
}
