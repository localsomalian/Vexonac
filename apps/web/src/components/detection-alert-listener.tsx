"use client";

import { webSocketService } from "@/lib/websocket";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

const SEVERITY_EMOJI: Record<string, string> = {
  CRITICAL: "🔴",
  HIGH:     "🟠",
  MEDIUM:   "🟡",
  LOW:      "🔵",
};

export function DetectionAlertListener() {
  const params = useParams();
  const router = useRouter();
  const serverId = params?.serverId as string | undefined;
  const subscribedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!serverId || subscribedRef.current === serverId) return;

    subscribedRef.current = serverId;
    webSocketService.subscribeToServer(serverId);

    const handleAlert = (data: any) => {
      if (data.serverId !== serverId) return;

      const emoji = SEVERITY_EMOJI[data.severity] ?? "⚠️";
      const label = data.severity === "CRITICAL" ? "CRITICAL ALERT" : "Detection";

      toast(`${emoji} ${label}: ${data.code}`, {
        description: `${data.playerName} — score ${data.totalScore} (+${data.pts} pts)`,
        duration: data.severity === "CRITICAL" ? 10000 : 6000,
        action: {
          label: "View",
          onClick: () => router.push(`/dashboard/server/${serverId}/detections`),
        },
      });
    };

    webSocketService.on("detection:alert", handleAlert);

    return () => {
      webSocketService.off("detection:alert", handleAlert);
      subscribedRef.current = null;
    };
  }, [serverId, router]);

  return null;
}
