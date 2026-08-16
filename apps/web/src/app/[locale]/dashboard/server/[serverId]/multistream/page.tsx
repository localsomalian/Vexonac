"use client";
import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import dynamic from "next/dynamic";
const MultiStreamViewer = dynamic(
	() => import("@/components/multi-stream-viewer").then((m) => m.MultiStreamViewer),
	{ ssr: false }
);
import { SiteHeader } from "@/components/panel-header";
import { useSession } from "@/hooks/use-session";
import { hasPermission } from "@/lib/utils";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import type { Permission } from "@vexonac/database";
import { ShieldAlert, WifiOff } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export default function ServerMultiStream() {
  const params = useParams();
  const serverId = params.serverId as string;
  const { data: session } = useSession();
  const t = useScopedI18n("server_multistream");

  const [streamStates, setStreamStates] = useState<Map<string, boolean>>(
    new Map<string, boolean>()
  );

  const { data: server, isLoading } = useQuery(
    trpc.servers.getServer.queryOptions(serverId, {
      enabled: !!session?.user,
    })
  );

  // Fetch current players for multi-stream
  const { data: playersData } = useQuery(
    trpc.servers.getCurrentPlayers.queryOptions(
      { serverId },
      {
        enabled: !!session?.user && !!server?.serverInfo?.isOnline,
        refetchInterval: 5000,
      }
    )
  );

  // Check permissions - user must be a server member (have ANY permission)
  const isAllowed = useMemo(() => {
    if (!server) return false;
    if (server.isOwner) return true;
    if (server.permissions && Array.isArray(server.permissions)) {
      const permissions = server.permissions.map((p) =>
        String(p)
      ) as Permission[];
      return hasPermission(permissions, "ANY");
    }
    return false;
  }, [server, serverId]);

  const handleStreamStateChange = useCallback(
    (playerId: string, isStreaming: boolean) => {
      setStreamStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(playerId, isStreaming);
        return newMap;
      });
    },
    []
  );

  if (isLoading) {
    return (
      <>
        <SiteHeader
          title={t("title")}
          breadcrumb={{
            title: "Dashboard",
            url: `/dashboard/server/${serverId}`,
          }}
        />
        <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
      </>
    );
  }

  if (!isAllowed) {
    return (
      <>
        <SiteHeader
          title={formatServerName(server?.serverName || t("title"))}
          breadcrumb={{
            title: "Dashboard",
            url: `/dashboard/server/${serverId}`,
          }}
        />
        <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <ShieldAlert className="h-16 w-16 text-destructive/60 mb-4" />
            <h2 className="text-2xl font-bold">{t("access_denied")}</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              {t("access_denied_description")}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!server?.serverInfo?.isOnline) {
    return (
      <ContentLayout
        title={formatServerName(server?.serverName || t("title"))}
        breadcrumb={{
          title: "Dashboard",
          url: `/dashboard/server/${serverId}`,
        }}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold">{t("server_offline")}</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            {t("server_offline_description")}
          </p>
        </div>
      </ContentLayout>
    );
  }

  return (
    <>
      <SiteHeader
        title={formatServerName(server?.serverName || t("title"))}
        breadcrumb={{
          title: "Dashboard",
          url: `/dashboard/server/${serverId}`,
        }}
      />

      {/* Custom layout for full height */}
      <div className="flex flex-col h-[calc(100dvh-3.5rem)]">
        {/* Content area */}
        <div className="flex-1 min-h-0">
          <MultiStreamViewer
            serverId={serverId}
            players={playersData || []}
            isVisible={true}
            onStreamStateChange={handleStreamStateChange}
          />
        </div>
      </div>
    </>
  );
}

