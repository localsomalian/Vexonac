"use client";
import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import type { MapMarker } from "@/components/gta-map";
import { SiteHeader } from "@/components/panel-header";
const StreamViewer = dynamic(
	() => import("@/components/stream-viewer").then((m) => m.StreamViewer),
	{ ssr: false }
);
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/hooks/use-session";
import { hasPermission } from "@/lib/utils";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Permission } from "@vexonac/database";
import { Camera, ExternalLink, Eye, Loader2, ShieldAlert, Square, WifiOff } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Dynamic import for map to avoid SSR issues with Leaflet
const InteractiveGtaMap = dynamic(
  () =>
    import("@/components/gta-map/interactive-gta-map").then(
      (mod) => mod.InteractiveGtaMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    ),
  }
);

export default function ServerMap() {
  const params = useParams();
  const serverId = params.serverId as string;
  const { data: session } = useSession();
  const t = useScopedI18n("interactive_map");
  const tPlayers = useScopedI18n("server_players");
  const [spectateModal, setSpectateModal] = useState<{
    isOpen: boolean;
    player: MapMarker | null;
  }>({ isOpen: false, player: null });

  const [screenshotModal, setScreenshotModal] = useState<{
    isOpen: boolean;
    url: string | null;
    playerName: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    url: null,
    playerName: null,
    isLoading: false,
  });

  const { data: serverData, isLoading } = useQuery(
    trpc.servers.getServer.queryOptions(serverId, {
      enabled: !!session?.user,
    })
  );
  
  // Check permissions - user must be a server member (have ANY permission)
  const isAllowed = useMemo(() => {
    if (!serverData) return false;
    if (serverData.isOwner) return true;
    if (serverData.permissions && Array.isArray(serverData.permissions)) {
      const permissions = serverData.permissions.map((p: any) =>
        String(p)
      ) as Permission[];
      return hasPermission(permissions, "ANY");
    }
    return false;
  }, [serverData]);

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    console.log("Marker clicked:", marker);
    // Handle marker click - could open a detail modal, etc.
  }, []);

  const handleSpectateClick = useCallback((marker: MapMarker) => {
    setSpectateModal({ isOpen: true, player: marker });
  }, []);

  const handleScreenshotClick = useCallback((marker: MapMarker) => {
    setScreenshotModal({
      isOpen: true,
      url: null,
      playerName: marker.name,
      isLoading: true,
    });
    screenshotPlayerMutation.mutate({
      serverId,
      eventName: "screenshotPlayer",
      data: { playerId: marker.id },
    });
  }, [serverId]);

  // Screenshot mutation
  const screenshotPlayerMutation = useMutation(
    trpc.fivem.event.mutationOptions({
      onSuccess: (data: any) => {
        if (data.screenshotUrl) {
          setScreenshotModal((prev) => ({
            ...prev,
            url: data.screenshotUrl,
            isLoading: false,
          }));
          toast.success(tPlayers("screenshot_captured"));
        }
      },
      onError: (error: any) => {
        setScreenshotModal((prev) => ({
          ...prev,
          url: null,
          isLoading: false,
        }));
        toast.error(error.message || tPlayers("screenshot_failed"));
      },
    })
  );

  if (isLoading) {
    return (
      <>
        <SiteHeader
          title={t("title")}
          breadcrumb={{
            title: t("dashboard"),
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
          title={formatServerName(serverData?.serverName || t("title"))}
          breadcrumb={{
            title: t("dashboard"),
            url: `/dashboard/server/${serverId}`,
          }}
        />
        <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <ShieldAlert className="h-16 w-16 text-destructive/60 mb-4" />
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              You don't have permission to access this server map. Contact the
              server owner to get added as a server member.
            </p>
          </div>
        </div>
      </>
    );
  }

  // if (!server?.serverInfo?.isOnline) {
  //   return (
  //     <ContentLayout
  //       title={formatServerName(server?.serverName || "Map")}
  //       breadcrumb={{
  //         title: "Dashboard",
  //         url: `/dashboard/server/${serverId}`,
  //       }}
  //     >
  //       <div className="flex flex-col items-center justify-center p-8 text-center">
  //         <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
  //         <h2 className="text-2xl font-bold">Server Offline</h2>
  //         <p className="text-muted-foreground mt-2 max-w-md">
  //           This server is currently offline. Map is only available when the
  //           server is online.
  //         </p>
  //       </div>
  //     </ContentLayout>
  //   );
  // }

  return (
    <>
      <SiteHeader
        title={formatServerName(serverData?.serverName || t("title"))}
        breadcrumb={{
          title: t("dashboard"),
          url: `/dashboard/server/${serverId}`,
        }}
      />

      {/* Content area - full height map */}
      <div className="h-[calc(100dvh-3.5rem)] p-4">
        <div className="h-full w-full overflow-hidden rounded-lg border">
          <InteractiveGtaMap
            onMarkerClick={handleMarkerClick}
            onSpectateClick={handleSpectateClick}
            onScreenshotClick={handleScreenshotClick}
            height="100%"
            serverId={serverId}
            initialSettings={{
              center: { x: 0, y: -1200 }, // Start at GTA V center (0,0)
              showCoordinates: false,
            }}
          />
        </div>
      </div>

      {/* Spectate Modal */}
      <Dialog
        open={spectateModal.isOpen}
        onOpenChange={(open) =>
          setSpectateModal({ isOpen: open, player: spectateModal.player })
        }
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {tPlayers("watch_player_title")} - {spectateModal.player?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {spectateModal.player && (
              <StreamViewer
                serverId={serverId}
                playerId={spectateModal.player.id.toString()}
                playerName={spectateModal.player.name}
                playerLicense={spectateModal.player.license}
              />
            )}
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setSpectateModal({ isOpen: false, player: null })}
            >
              <Square className="h-4 w-4 mr-2" />
              {tPlayers("stop_watching")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screenshot Modal */}
      <Dialog
        open={screenshotModal.isOpen}
        onOpenChange={() =>
          setScreenshotModal({
            isOpen: false,
            url: null,
            playerName: null,
            isLoading: false,
          })
        }
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {tPlayers("screenshot_title")} - {screenshotModal.playerName}
            </DialogTitle>
            <DialogDescription>
              {tPlayers("screenshot_description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {screenshotModal.isLoading ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {tPlayers("capturing_screenshot")}
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  {tPlayers("screenshot_wait_notice")}
                </p>
              </div>
            ) : screenshotModal.url ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={screenshotModal.url}
                    alt={`Screenshot of ${screenshotModal.playerName}`}
                    className="w-full h-auto rounded-lg border"
                    onError={(e) => {
                      console.error("Failed to load screenshot image");
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{tPlayers("screenshot_captured")}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (typeof window === "undefined") return;
                      window.open(screenshotModal.url!, "_blank");
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {tPlayers("open_in_new_tab")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Camera className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {tPlayers("screenshot_failed")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tPlayers("screenshot_failed_description")}
                  </p>
                  <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                    <li>• {tPlayers("screenshot_error_1")}</li>
                    <li>• {tPlayers("screenshot_error_2")}</li>
                    <li>• {tPlayers("screenshot_error_3")}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

