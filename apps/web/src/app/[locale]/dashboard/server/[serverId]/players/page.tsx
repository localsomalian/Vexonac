"use client";

import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import dynamic from "next/dynamic";
const PlayerMiniMap = dynamic(
	() => import("@/components/gta-map/gta-map").then((m) => m.PlayerMiniMap),
	{ ssr: false }
);
const StreamViewer = dynamic(
	() => import("@/components/stream-viewer").then((m) => m.StreamViewer),
	{ ssr: false }
);
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "@/hooks/use-session";
import { getThreatScoreColor, hasPermission } from "@/lib/utils";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Permission } from "@vexonac/database";
import type { PlayerData } from "@vexonac/types";
import {
  Ban,
  Camera,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Footprints,
  Gavel,
  Loader2,
  Play,
  Search,
  Shield,
  ShieldAlert,
  Skull,
  Square,
  Swords,
  Users,
  Waves,
  Wifi,
  WifiHigh,
  WifiLow,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Types - using any to avoid complex import issues while maintaining functionality
interface FilterOptions {
  search: string;
  sortBy: "name" | "id" | "playTime" | "ping" | "timeOnline" | "threatScore";
  sortOrder: "asc" | "desc";
  statusFilter:
    | "all"
    | "on_foot"
    | "in_vehicle"
    | "swimming"
    | "armed"
    | "dead";
  showNewPlayers: boolean;
  showRecentlyJoined: boolean;
  showPotentialThreats: boolean;
}

// Saved filter options (everything except search)
interface SavedFilterOptions {
  sortBy: FilterOptions["sortBy"];
  sortOrder: FilterOptions["sortOrder"];
  statusFilter: FilterOptions["statusFilter"];
  showNewPlayers: boolean;
  showRecentlyJoined: boolean;
  showPotentialThreats: boolean;
}

interface PlayerActionModal {
  type: "kick" | "ban" | "screenshot" | "spectate" | "details" | "watch" | null;
  player: any | null;
}

interface ScreenshotModal {
  isOpen: boolean;
  url: string | null;
  playerName: string | null;
  isLoading: boolean;
}

// Player Card Component
function PlayerCard({
  player,
  onAction,
}: {
  player: PlayerData;
  onAction: (type: string, player: PlayerData) => void;
}) {
  const t = useScopedI18n("server_players");

  const getPingColor = (ping: number) => {
    if (ping <= 0) return "text-red-500";
    if (ping <= 50) return "text-green-500";
    if (ping <= 100) return "text-yellow-500";
    return "text-orange-500";
  };

  const getPingIcon = (ping: number) => {
    if (ping <= 0) return <WifiOff className="h-4 w-4" />;
    if (ping <= 50) return <Wifi className="h-4 w-4" />;
    if (ping <= 100) return <WifiHigh className="h-4 w-4" />;
    return <WifiLow className="h-4 w-4" />;
  };

  const getStatusConfig = (
    status: string
  ): {
    icon: React.JSX.Element;
    bgColor: string;
    textColor: string;
    label: string;
  } => {
    const statusConfigs: Record<
      string,
      {
        icon: React.JSX.Element;
        bgColor: string;
        textColor: string;
        label: string;
      }
    > = {
      ON_FOOT: {
        icon: <Footprints className="h-5 w-5" />,
        bgColor: "bg-green-100 dark:bg-green-900/30",
        textColor: "text-green-500",
        label: t("status.on_foot"),
      },
      IN_VEHICLE: {
        icon: <Car className="h-5 w-5" />,
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
        textColor: "text-amber-500",
        label: t("status.in_vehicle"),
      },
      SWIMMING: {
        icon: <Waves className="h-5 w-5" />,
        bgColor: "bg-violet-100 dark:bg-violet-900/30",
        textColor: "text-violet-500",
        label: t("status.swimming"),
      },
      ARMED: {
        icon: <Swords className="h-5 w-5" />,
        bgColor: "bg-red-100 dark:bg-red-900/30",
        textColor: "text-red-500",
        label: t("status.armed"),
      },
      DEAD: {
        icon: <Skull className="h-5 w-5" />,
        bgColor: "bg-gray-100 dark:bg-gray-900/30",
        textColor: "text-gray-500",
        label: t("status.dead"),
      },
    };
    return (statusConfigs[status] || statusConfigs["ON_FOOT"]) as {
      icon: React.JSX.Element;
      bgColor: string;
      textColor: string;
      label: string;
    };
  };

  const statusConfig = getStatusConfig(player.status);
  const isNewPlayer = (player.playTime || 0) < 60;
  const isRecentlyJoined = player.timeOnline < 30;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className="group hover:shadow-sm transition-all duration-200 cursor-pointer p-0"
            onClick={() => onAction("details", player)}
          >
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="relative group mr-3">
                      <div className="rounded-full h-10 w-10 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="h-10 w-10 flex items-center justify-center">
                          <div
                            className={`${statusConfig.textColor} ${statusConfig.bgColor} rounded-full h-full w-full flex items-center justify-center transition-colors`}
                          >
                            {statusConfig.icon}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-semibold truncate max-w-[150px]">
                          <span className="text-muted-foreground text-xs">
                            #{player.id}
                          </span>{" "}
                          {player.name}
                        </h3>
                        {player.admin && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            {t("admin")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {t("joined_time_ago", {
                            hours: Math.floor(player.timeOnline / 60),
                            minutes: player.timeOnline % 60,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center">
                      <div
                        className={`flex items-center gap-1 ${getPingColor(
                          player.ping
                        )}`}
                      >
                        {getPingIcon(player.ping)}
                        <span className="text-xs font-mono">
                          {player.ping <= 0
                            ? t("off")
                            : t("ping_ms", { ping: player.ping })}
                        </span>
                      </div>
                    </div>

                    {/* Threat Score */}
                    {player.threatScore !== undefined && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                              <div
                                className={`w-2 h-2 rounded-full ${getThreatScoreColor(
                                  player.threatScore,
                                  true
                                )}`}
                              />
                              <span
                                className={`text-xs font-mono ${getThreatScoreColor(
                                  player.threatScore,
                                  false
                                )}`}
                              >
                                {player.threatScore}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {t("trust_score")}: {player.threatScore}/100
                              <br />
                              {player.threatScore >= 80
                                ? t("high_threat")
                                : player.threatScore >= 60
                                ? t("medium_threat")
                                : player.threatScore >= 40
                                ? t("low_threat")
                                : t("minimal_threat")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>

                {/* Health Bar */}
                {player.health !== undefined && (
                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span>{t("health")}</span>
                        <span>{player.health || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            player.health >= 70
                              ? "bg-green-500"
                              : player.health >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${player.health || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Play className="h-3 w-3 mr-1" />
                    <span>
                      {t("played_time", {
                        hours: Math.floor((player.playTime || 0) / 60),
                        minutes: (player.playTime || 0) % 60,
                      })}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {isNewPlayer && (
                      <Badge
                        variant="default"
                        className="text-[10px] px-1 py-0 h-4"
                      >
                        {t("new")}
                      </Badge>
                    )}
                    {isRecentlyJoined && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1 py-0 h-4"
                      >
                        {t("just_joined")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-0 w-80 h-60">
          <PlayerMiniMap coords={player.coords} playerName={player.name} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function ServerPlayers() {
  const params = useParams();
  const serverId = params.serverId as string;

  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const t = useScopedI18n("server_players");

  // Default filter values
  const defaultFilters: FilterOptions = {
    search: "",
    sortBy: "threatScore",
    sortOrder: "desc",
    statusFilter: "all",
    showNewPlayers: false,
    showRecentlyJoined: false,
    showPotentialThreats: false,
  };

  // Load saved filters from localStorage
  const loadSavedFilters = (): SavedFilterOptions => {
    if (typeof window === "undefined") return defaultFilters;

    try {
      const saved = localStorage.getItem(`player-filters-${serverId}`);
      if (saved) {
        const parsed = JSON.parse(saved) as SavedFilterOptions;
        return {
          sortBy: parsed.sortBy || defaultFilters.sortBy,
          sortOrder: parsed.sortOrder || defaultFilters.sortOrder,
          statusFilter: parsed.statusFilter || defaultFilters.statusFilter,
          showNewPlayers: parsed.showNewPlayers || false,
          showRecentlyJoined: parsed.showRecentlyJoined || false,
          showPotentialThreats: parsed.showPotentialThreats || false,
        };
      }
    } catch (error) {
      console.error("Failed to load saved filters:", error);
    }
    return defaultFilters;
  };

  // Save filters to localStorage
  const saveFilters = (filters: FilterOptions) => {
    if (typeof window === "undefined") return;

    try {
      const toSave: SavedFilterOptions = {
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        statusFilter: filters.statusFilter,
        showNewPlayers: filters.showNewPlayers,
        showRecentlyJoined: filters.showRecentlyJoined,
        showPotentialThreats: filters.showPotentialThreats,
      };
      localStorage.setItem(
        `player-filters-${serverId}`,
        JSON.stringify(toSave)
      );
    } catch (error) {
      console.error("Failed to save filters:", error);
    }
  };

  // Initialize state with saved filters (search always starts empty)
  const [filters, setFilters] = useState<FilterOptions>(() => {
    const savedFilters = loadSavedFilters();
    return {
      ...savedFilters,
      search: "", // Always start with empty search
    };
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [actionModal, setActionModal] = useState<PlayerActionModal>({
    type: null,
    player: null,
  });
  const [actionForm, setActionForm] = useState({
    reason: "",
    duration: 24 * 60 * 60,
    banType: "permanent" as "permanent" | "temporary",
  });
  const [screenshotModal, setScreenshotModal] = useState<ScreenshotModal>({
    isOpen: false,
    url: null,
    playerName: null,
    isLoading: true,
  });

  const playersPerPage = 16;

  // Fetch server data
  const { data: server, isLoading: serverLoading } = useQuery(
    trpc.servers.getServer.queryOptions(serverId, {
      enabled: !!session?.user,
    })
  );

  const { data: playersData, isLoading: playersLoading } = useQuery(
    trpc.servers.getCurrentPlayers.queryOptions(
      { serverId },
      {
        enabled: !!session?.user && !!server?.serverInfo?.isOnline,
        refetchInterval: 5000,
      }
    )
  );

  // Check permissions
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

  const canManagePlayers = useMemo(() => {
    if (!server) return false;
    if (server.isOwner) return true;
    if (server.permissions && Array.isArray(server.permissions)) {
      const permissions = server.permissions.map((p) =>
        String(p)
      ) as Permission[];
      return (
        hasPermission(permissions, "MANAGE_BANS") ||
        hasPermission(permissions, "PLAYERS_KICK")
      );
    }
    return false;
  }, [server]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    if (!playersData) return [];

    let filtered = [...playersData];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (player: any) =>
          player.name.toLowerCase().includes(searchLower) ||
          player.id.toString().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.statusFilter !== "all") {
      if (filters.statusFilter === "on_foot") {
        filtered = filtered.filter(
          (player: any) => player.status === "ON_FOOT"
        );
      } else if (filters.statusFilter === "in_vehicle") {
        filtered = filtered.filter(
          (player: any) => player.status === "IN_VEHICLE"
        );
      } else if (filters.statusFilter === "swimming") {
        filtered = filtered.filter(
          (player: any) => player.status === "SWIMMING"
        );
      } else if (filters.statusFilter === "armed") {
        filtered = filtered.filter((player: any) => player.status === "ARMED");
      } else if (filters.statusFilter === "dead") {
        filtered = filtered.filter((player: any) => player.status === "DEAD");
      }
    }

    // Apply new players filter
    if (filters.showNewPlayers) {
      filtered = filtered.filter((player: any) => (player.playTime || 0) < 60);
    }

    // Apply recently joined filter
    if (filters.showRecentlyJoined) {
      filtered = filtered.filter((player: any) => player.timeOnline < 30);
    }

    // Apply potential threats filter
    if (filters.showPotentialThreats) {
      filtered = filtered.filter(
        (player: any) => (player.threatScore || 0) >= 60
      );
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "id":
          aValue = a.id;
          bValue = b.id;
          break;
        case "playTime":
          aValue = a.playTime || 0;
          bValue = b.playTime || 0;
          break;
        case "ping":
          aValue = a.ping;
          bValue = b.ping;
          break;
        case "timeOnline":
          aValue = a.timeOnline;
          bValue = b.timeOnline;
          break;
        case "threatScore":
          aValue = a.threatScore || 0;
          bValue = b.threatScore || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [playersData, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const startIndex = (currentPage - 1) * playersPerPage;
  const endIndex = startIndex + playersPerPage;
  const currentPlayers = filteredPlayers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
      // Save to localStorage only if non-search filters changed
      const nonSearchUpdate = Object.keys(newFilters).some(
        (key) => key !== "search"
      );
      if (nonSearchUpdate) {
        saveFilters(updated);
      }
      return updated;
    });
    setCurrentPage(1);
  };

  // Save filters on component mount and when serverId changes
  useEffect(() => {
    // This ensures filters are saved when the component first loads with saved state
    saveFilters(filters);
  }, [serverId]); // Only run when serverId changes

  // Mutations for player actions
  const kickPlayerMutation = useMutation(
    trpc.fivem.event.mutationOptions({
      onSuccess: () => {
        toast.success(
          `Successfully kicked ${actionModal.player?.name || "player"}`
        );
        setActionModal({ type: null, player: null });
        setActionForm({
          reason: "",
          duration: 24 * 60 * 60,
          banType: "permanent",
        });
        queryClient.invalidateQueries({
          queryKey: [["servers", "getCurrentPlayers"]],
        });
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to kick player");
      },
    })
  );

  const banPlayerEventMutation = useMutation(
    trpc.fivem.event.mutationOptions({
      onSuccess: () => {
        toast.success(
          `Successfully banned ${actionModal.player?.name || "player"}`
        );
        setActionModal({ type: null, player: null });
        setActionForm({
          reason: "",
          duration: 24 * 60 * 60,
          banType: "permanent",
        });
        queryClient.invalidateQueries({
          queryKey: [["servers", "getCurrentPlayers"]],
        });
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to ban player");
      },
    })
  );

  const screenshotPlayerMutation = useMutation(
    trpc.fivem.event.mutationOptions({
      onSuccess: (data: any) => {
        if (data.screenshotUrl) {
          setScreenshotModal({
            isOpen: true,
            url: data.screenshotUrl,
            playerName: actionModal.player?.name || "Unknown Player",
            isLoading: false,
          });
          toast.success(t("screenshot_captured"));
        }
        setActionModal({ type: null, player: null });
      },
      onError: (error: any) => {
        setScreenshotModal({
          isOpen: true,
          url: null,
          playerName: actionModal.player?.name || "Unknown Player",
          isLoading: false,
        });
        toast.error(error.message || t("screenshot_failed"));
      },
    })
  );

  // Handle player actions
  const handlePlayerAction = (type: string, player: any) => {
    if (type === "details" || type === "screenshot" || type === "watch") {
      setActionModal({ type: type as any, player });
    } else if (canManagePlayers) {
      setActionModal({ type: type as any, player });
    } else {
      toast.error("You don't have permission to perform this action");
    }
  };

  // Handle action execution
  const executeAction = () => {
    if (!actionModal.player) return;

    switch (actionModal.type) {
      case "kick":
        kickPlayerMutation.mutate({
          serverId,
          eventName: "kickPlayer",
          data: {
            playerId: actionModal.player.id,
            reason: actionForm.reason || "No reason provided",
            by: session?.user?.name || "Unknown Admin",
          },
        });
        break;
      case "ban":
        banPlayerEventMutation.mutate({
          serverId,
          eventName: "banPlayer",
          data: {
            playerId: actionModal.player.id,
            reason: actionForm.reason,
            by: session?.user?.name || "Unknown Admin",
            duration:
              actionForm.banType === "temporary"
                ? actionForm.duration
                : undefined,
          },
        });
        break;
      case "screenshot":
        setScreenshotModal({
          isOpen: true,
          url: null,
          playerName: actionModal.player.name,
          isLoading: true,
        });
        screenshotPlayerMutation.mutate({
          serverId,
          eventName: "screenshotPlayer",
          data: { playerId: actionModal.player.id },
        });
        break;
      case "spectate":
        toast.info(t("spectate_notice"));
        setActionModal({ type: null, player: null });
        break;
    }
  };

  if (serverLoading) {
    return (
      <ContentLayout
        title={t("title")}
        breadcrumb={{
          title: t("dashboard"),
          url: `/dashboard/server/${serverId}`,
        }}
      >
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
      </ContentLayout>
    );
  }

  if (!isAllowed) {
    return (
      <ContentLayout
        title={formatServerName(server?.serverName || t("title"))}
        breadcrumb={{
          title: t("dashboard"),
          url: `/dashboard/server/${serverId}`,
        }}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive/60 mb-4" />
          <h2 className="text-2xl font-bold">{t("access_denied")}</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            {t("access_denied_description")}
          </p>
        </div>
      </ContentLayout>
    );
  }

  if (!server?.serverInfo?.isOnline) {
    return (
      <ContentLayout
        title={formatServerName(server?.serverName || t("title"))}
        breadcrumb={{
          title: t("dashboard"),
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
    <ContentLayout
      title={formatServerName(server?.serverName || t("title"))}
      breadcrumb={{
        title: t("dashboard"),
        url: `/dashboard/server/${serverId}`,
      }}
    >
      <div className="space-y-6">
        {/* Header with player count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{t("online_players")}</h1>
            <Badge variant="secondary" className="ml-2">
              {playersData?.length || 0}/{server?.serverInfo?.maxSlots || 0}
            </Badge>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-4">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("search_placeholder")}
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Sort & Filter Dropdown */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {t("sort_filter")}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t("sort_by")}</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleFilterChange({ sortBy: "name" })}
                  >
                    {t("name")} {filters.sortBy === "name" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterChange({ sortBy: "id" })}
                  >
                    {t("player_id")} {filters.sortBy === "id" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterChange({ sortBy: "playTime" })}
                  >
                    {t("play_time")} {filters.sortBy === "playTime" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterChange({ sortBy: "ping" })}
                  >
                    {t("ping")} {filters.sortBy === "ping" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterChange({ sortBy: "timeOnline" })}
                  >
                    {t("time_online_sort")}{" "}
                    {filters.sortBy === "timeOnline" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleFilterChange({ sortBy: "threatScore" })
                    }
                  >
                    {t("threat_score")}{" "}
                    {filters.sortBy === "threatScore" && "✓"}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() =>
                      handleFilterChange({
                        sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
                      })
                    }
                  >
                    {filters.sortOrder === "asc"
                      ? t("ascending")
                      : t("descending")}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>{t("filter_by_status")}</DropdownMenuLabel>

                  <DropdownMenuItem
                    onClick={() => handleFilterChange({ statusFilter: "all" })}
                  >
                    {t("all_players")} {filters.statusFilter === "all" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleFilterChange({ statusFilter: "dead" })}
                  >
                    {t("dead")} {filters.statusFilter === "dead" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleFilterChange({ statusFilter: "armed" })
                    }
                  >
                    {t("armed")} {filters.statusFilter === "armed" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleFilterChange({ statusFilter: "in_vehicle" })
                    }
                  >
                    {t("in_vehicle")}{" "}
                    {filters.statusFilter === "in_vehicle" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleFilterChange({ statusFilter: "on_foot" })
                    }
                  >
                    {t("on_foot")} {filters.statusFilter === "on_foot" && "✓"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Player Type Filter Checkboxes */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="newPlayers"
                checked={filters.showNewPlayers}
                onCheckedChange={(checked) =>
                  handleFilterChange({ showNewPlayers: checked === true })
                }
              />
              <Label htmlFor="newPlayers" className="text-sm">
                {t("show_new_players")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recentlyJoined"
                checked={filters.showRecentlyJoined}
                onCheckedChange={(checked) =>
                  handleFilterChange({ showRecentlyJoined: checked === true })
                }
              />
              <Label htmlFor="recentlyJoined" className="text-sm">
                {t("show_recently_joined")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="potentialThreats"
                checked={filters.showPotentialThreats}
                onCheckedChange={(checked) =>
                  handleFilterChange({ showPotentialThreats: checked === true })
                }
              />
              <Label htmlFor="potentialThreats" className="text-sm">
                {t("show_potential_threats")}
              </Label>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        {playersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-16 w-16 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : currentPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">{t("no_players_found")}</h3>
            <p className="text-muted-foreground mt-2">
              {filters.search ||
              filters.statusFilter !== "all" ||
              filters.showNewPlayers ||
              filters.showRecentlyJoined ||
              filters.showPotentialThreats
                ? t("no_players_filters")
                : t("no_players_online")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentPlayers.map((player: any) => (
              <PlayerCard
                key={player.id}
                player={player}
                onAction={handlePlayerAction}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("showing_results", {
                start: startIndex + 1,
                end: Math.min(endIndex, filteredPlayers.length),
                total: filteredPlayers.length,
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("previous_page")}
              </Button>
              <span className="text-sm">
                {t("page_of", { page: currentPage, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                {t("next_page")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Player Action Modals */}
        <Dialog
          open={actionModal.type !== null}
          onOpenChange={() => setActionModal({ type: null, player: null })}
        >
          <DialogContent className="sm:max-w-[600px]">
            {actionModal.type === "details" && actionModal.player && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    {t("player_details")} - {actionModal.player.name}
                  </DialogTitle>
                  <DialogDescription>
                    {t("player_details_description")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Player Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        {t("player_name")}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {actionModal.player.name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        {t("player_id")}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {actionModal.player.id}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        {t("status_label")}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {actionModal.player.status}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        {t("time_online")}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {Math.floor(actionModal.player.timeOnline / 60)}h{" "}
                        {actionModal.player.timeOnline % 60}m
                      </p>
                    </div>
                    {actionModal.player.playTime && (
                      <div>
                        <Label className="text-sm font-medium">
                          {t("total_play_time")}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("played_time", {
                            hours: Math.floor(actionModal.player.playTime / 60),
                            minutes: actionModal.player.playTime % 60,
                          })}
                        </p>
                      </div>
                    )}
                    {actionModal.player.threatScore !== undefined && (
                      <div>
                        <Label className="text-sm font-medium">
                          {t("trust_score")}
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className={`w-3 h-3 rounded-full ${getThreatScoreColor(
                              actionModal.player.threatScore,
                              true
                            )}`}
                          />
                          <p className="text-sm text-muted-foreground">
                            {actionModal.player.threatScore}/100
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lookup Notice */}
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm mb-3">{t("lookup_notice")}</p>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/dashboard/server/${serverId}/lookup?license=${actionModal.player.license}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t("open_in_lookup")}
                      </Link>
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Management Actions - Kick & Ban */}
                    {canManagePlayers && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() =>
                            setActionModal({
                              type: "kick",
                              player: actionModal.player,
                            })
                          }
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          {t("kick_player")}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() =>
                            setActionModal({
                              type: "ban",
                              player: actionModal.player,
                            })
                          }
                        >
                          <Gavel className="h-4 w-4 mr-2" />
                          {t("ban_player")}
                        </Button>
                      </div>
                    )}

                    {/* Monitoring Actions - Screenshot & Watch */}
                    {isAllowed && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() =>
                            setActionModal({
                              type: "screenshot",
                              player: actionModal.player,
                            })
                          }
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          {t("screenshot")}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() =>
                            setActionModal({
                              type: "watch",
                              player: actionModal.player,
                            })
                          }
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t("watch_player")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {actionModal.type === "ban" && actionModal.player && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    {t("ban_player_title")} - {actionModal.player.name}
                  </DialogTitle>
                  <DialogDescription>
                    {t("ban_player_description")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reason">{t("ban_reason_required")}</Label>
                    <Textarea
                      id="reason"
                      placeholder={t("ban_reason_placeholder")}
                      value={actionForm.reason}
                      onChange={(e) =>
                        setActionForm((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="permanentBan"
                      checked={actionForm.banType === "permanent"}
                      onCheckedChange={(checked) =>
                        setActionForm((prev) => ({
                          ...prev,
                          banType: checked ? "permanent" : "temporary",
                        }))
                      }
                    />
                    <Label htmlFor="permanentBan">{t("permanent_ban")}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {actionForm.banType === "permanent"
                      ? t("permanent_ban_description")
                      : t("temporary_ban_description")}
                  </p>

                  {actionForm.banType === "temporary" && (
                    <div>
                      <Label htmlFor="duration">{t("duration_hours")}</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="8760"
                        value={actionForm.duration / (60 * 60)}
                        onChange={(e) =>
                          setActionForm((prev) => ({
                            ...prev,
                            duration:
                              parseInt(e.target.value) * 60 * 60 ||
                              24 * 60 * 60,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setActionModal({ type: null, player: null })}
                    disabled={banPlayerEventMutation.isPending}
                  >
                    {t("cancel_ban")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (!actionForm.reason.trim()) {
                        toast.error(t("reason_required_error"));
                        return;
                      }
                      executeAction();
                    }}
                    disabled={
                      banPlayerEventMutation.isPending ||
                      !actionForm.reason.trim()
                    }
                  >
                    {banPlayerEventMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("banning")}
                      </>
                    ) : (
                      <>
                        <Gavel className="h-4 w-4 mr-2" />
                        {t("ban_player")}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}

            {actionModal.type === "kick" && actionModal.player && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Ban className="h-5 w-5" />
                    {t("kick_player_title")} - {actionModal.player.name}
                  </DialogTitle>
                  <DialogDescription>
                    {t("kick_player_description")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="kickReason">{t("kick_reason")}</Label>
                    <Textarea
                      id="kickReason"
                      placeholder={t("kick_reason_placeholder")}
                      value={actionForm.reason}
                      onChange={(e) =>
                        setActionForm((prev) => ({
                          ...prev,
                          reason: e.target.value,
                        }))
                      }
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setActionModal({ type: null, player: null })}
                    disabled={kickPlayerMutation.isPending}
                  >
                    {t("cancel_kick")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={executeAction}
                    disabled={kickPlayerMutation.isPending}
                  >
                    {kickPlayerMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("kicking")}
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 mr-2" />
                        {t("kick_player")}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            )}

            {actionModal.type === "screenshot" && actionModal.player && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    {t("screenshot_player_title")} - {actionModal.player.name}
                  </DialogTitle>
                  <DialogDescription>
                    {t("screenshot_player_description")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("screenshot_notice")}
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setActionModal({ type: null, player: null })}
                  >
                    {t("cancel_screenshot")}
                  </Button>
                  <Button onClick={executeAction}>
                    <Camera className="h-4 w-4 mr-2" />
                    {t("take_screenshot")}
                  </Button>
                </DialogFooter>
              </>
            )}

            {actionModal.type === "watch" && actionModal.player && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    {t("watch_player_title")} - {actionModal.player.name}
                  </DialogTitle>
                  <DialogDescription>
                    {t("watch_player_description")}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <StreamViewer
                    serverId={serverId}
                    playerId={actionModal.player.id.toString()}
                    playerName={actionModal.player.name}
                    playerLicense={actionModal.player.license}
                  />
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setActionModal({ type: null, player: null })}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    {t("stop_watching")}
                  </Button>
                </DialogFooter>
              </>
            )}
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
                {t("screenshot_title")} - {screenshotModal.playerName}
              </DialogTitle>
              <DialogDescription>
                {t("screenshot_description")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {screenshotModal.isLoading ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {t("capturing_screenshot")}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    {t("screenshot_wait_notice")}
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
                    <span>{t("screenshot_captured")}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (typeof window === "undefined") return;
                        window.open(screenshotModal.url!, "_blank");
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t("open_in_new_tab")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {t("screenshot_failed")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("screenshot_failed_description")}
                    </p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                      <li>• {t("screenshot_error_1")}</li>
                      <li>• {t("screenshot_error_2")}</li>
                      <li>• {t("screenshot_error_3")}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ContentLayout>
  );
}

