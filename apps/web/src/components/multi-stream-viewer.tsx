"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getThreatScoreColor } from "@/lib/utils";
import { useScopedI18n } from "@/locales/client";
import type { PlayerData } from "@vexonac/types";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  Search,
  Shield,
  Users,
  Wifi,
  WifiHigh,
  WifiLow,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StreamViewer } from "./stream-viewer";

interface MultiStreamViewerProps {
  serverId: string;
  players: PlayerData[];
  isVisible: boolean;
  onStreamStateChange?: (playerId: string, isStreaming: boolean) => void;
}

interface FilterOptions {
  search: string;
  showRecentlyJoined: boolean;
  showLowPlaytime: boolean;
  showPotentialThreats: boolean;
  showAdmins: boolean;
}

type SortField = "name" | "playtime" | "threatScore" | "timeOnline";
type SortDirection = "asc" | "desc";

export function MultiStreamViewer({
  serverId,
  players,
  isVisible,
  onStreamStateChange,
}: MultiStreamViewerProps) {
  const t = useScopedI18n("server_multistream");
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable player references to prevent unnecessary stream reconnections
  const [stablePlayers, setStablePlayers] = useState<PlayerData[]>([]);

  // Update stable players while preserving references for existing players
  useEffect(() => {
    setStablePlayers((prevStable) => {
      const newStable: PlayerData[] = [];
      const prevPlayerMap = new Map(
        prevStable.map((player) => [player.id.toString(), player])
      );

      // For each new player, try to reuse the existing reference if the player still exists
      players.forEach((newPlayer) => {
        const existingPlayer = prevPlayerMap.get(newPlayer.id.toString());

        if (existingPlayer) {
          // Player exists, check if any important data has changed
          const hasChanged =
            existingPlayer.name !== newPlayer.name ||
            existingPlayer.ping !== newPlayer.ping ||
            existingPlayer.timeOnline !== newPlayer.timeOnline ||
            existingPlayer.playTime !== newPlayer.playTime ||
            existingPlayer.threatScore !== newPlayer.threatScore ||
            existingPlayer.admin !== newPlayer.admin;

          // If data changed, use new object, otherwise keep existing reference
          newStable.push(hasChanged ? newPlayer : existingPlayer);
        } else {
          // New player, use new object
          newStable.push(newPlayer);
        }
      });

      return newStable;
    });
  }, [players]);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);
  const [visibleStreamIds, setVisibleStreamIds] = useState<Set<string>>(
    new Set()
  );
  const [streamStates, setStreamStates] = useState<Map<string, boolean>>(
    new Map()
  );
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set()
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile && !isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
    }
  }, [isMobile]);

  // Load filters and sort from localStorage
  const getInitialFilters = (): FilterOptions => {
    const defaultFilters = {
      search: "", // Always start with empty search
      showRecentlyJoined: true,
      showLowPlaytime: true,
      showPotentialThreats: true,
      showAdmins: false,
    };

    if (typeof window === "undefined") {
      return defaultFilters;
    }

    try {
      const saved = localStorage.getItem("multistream-filters");
      if (saved) {
        const parsedFilters = JSON.parse(saved);
        // Merge saved filters but always use empty search
        return {
          ...parsedFilters,
          search: "", // Don't restore search
        };
      }
    } catch (error) {
      console.warn("Failed to load filters from localStorage:", error);
    }

    return defaultFilters;
  };

  const getInitialSort = (): { field: SortField; direction: SortDirection } => {
    if (typeof window === "undefined") {
      return { field: "name", direction: "asc" };
    }

    try {
      const saved = localStorage.getItem("multistream-sort");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn("Failed to load sort from localStorage:", error);
    }

    return { field: "threatScore", direction: "desc" };
  };

  const [filters, setFilters] = useState<FilterOptions>(getInitialFilters);
  const initialSort = getInitialSort();
  const [sortField, setSortField] = useState<SortField>(initialSort.field);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    initialSort.direction
  );

  // Save filters to localStorage (excluding search)
  useEffect(() => {
    try {
      const { search, ...filtersToSave } = filters;
      localStorage.setItem(
        "multistream-filters",
        JSON.stringify(filtersToSave)
      );
    } catch (error) {
      console.warn("Failed to save filters to localStorage:", error);
    }
  }, [filters]);

  // Save sort settings to localStorage
  useEffect(() => {
    try {
      const sortData = { field: sortField, direction: sortDirection };
      localStorage.setItem("multistream-sort", JSON.stringify(sortData));
    } catch (error) {
      console.warn("Failed to save sort to localStorage:", error);
    }
  }, [sortField, sortDirection]);

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = [...stablePlayers];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (player) =>
          player.name.toLowerCase().includes(searchLower) ||
          player.id.toString().includes(searchLower)
      );
    }

    // Apply specialty filters
    if (filters.showRecentlyJoined) {
      filtered = filtered.filter((player) => player.timeOnline < 30);
    }

    if (filters.showLowPlaytime) {
      filtered = filtered.filter((player) => (player.playTime || 0) < 60);
    }

    if (filters.showPotentialThreats) {
      filtered = filtered.filter((player) => (player.threatScore || 0) >= 60);
    }

    if (filters.showAdmins) {
      filtered = filtered.filter((player) => player.admin);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "playtime":
          aValue = a.playTime || 0;
          bValue = b.playTime || 0;
          break;
        case "threatScore":
          aValue = a.threatScore || 0;
          bValue = b.threatScore || 0;
          break;
        case "timeOnline":
          aValue = a.timeOnline || 0;
          bValue = b.timeOnline || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [stablePlayers, filters, sortField, sortDirection]);

  // Get only selected players for streaming
  const playersToStream = useMemo(() => {
    return filteredAndSortedPlayers.filter((player) =>
      selectedPlayers.has(player.id.toString())
    );
  }, [filteredAndSortedPlayers, selectedPlayers]);

  // Calculate grid layout for selected streams
  const getGridLayout = (count: number, isMobile: boolean) => {
    if (count === 0) return { cols: 0, rows: 0 };

    // Mobile: always 1 column
    if (isMobile) {
      return { cols: 1, rows: count };
    }

    // Desktop layout
    if (count === 1) return { cols: 1, rows: 1 };
    if (count === 2) return { cols: 2, rows: 1 };
    if (count === 3) return { cols: 3, rows: 1 };
    if (count === 4) return { cols: 2, rows: 2 };

    const cols = Math.min(count, 4);
    const rows = Math.ceil(count / cols);
    return { cols, rows };
  };

  const layout = getGridLayout(playersToStream.length, isMobile);

  // Handle stream state changes
  const handleStreamStateChange = useCallback(
    (playerId: string, isStreaming: boolean) => {
      setStreamStates((prev) => new Map(prev).set(playerId, isStreaming));
      onStreamStateChange?.(playerId, isStreaming);
    },
    [onStreamStateChange]
  );

  // Create stable handlers for each player to prevent unnecessary re-renders
  const playerStreamHandlers = useMemo(() => {
    const handlers = new Map<string, (isStreaming: boolean) => void>();
    playersToStream.forEach((player) => {
      const playerId = player.id.toString();
      if (!handlers.has(playerId)) {
        handlers.set(playerId, (isStreaming: boolean) => {
          handleStreamStateChange(playerId, isStreaming);
        });
      }
    });
    return handlers;
  }, [
    playersToStream.map((p) => p.id.toString()).join(","),
    handleStreamStateChange,
  ]);

  // Handle player selection
  const handlePlayerSelect = (playerId: string, selected: boolean) => {
    setSelectedPlayers((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(playerId);
        // Auto-start demo streams when adding players
        if (serverId === "demo") {
          setStreamStates((streamPrev) => new Map(streamPrev).set(playerId, true));
          onStreamStateChange?.(playerId, true);
        }
      } else {
        newSet.delete(playerId);
        // Stop stream when removing player
        if (serverId === "demo") {
          setStreamStates((streamPrev) => new Map(streamPrev).set(playerId, false));
          onStreamStateChange?.(playerId, false);
        }
      }
      return newSet;
    });
  };

  // Handle select all/none
  const handleSelectAll = () => {
    setSelectedPlayers(
      new Set(filteredAndSortedPlayers.map((p) => p.id.toString()))
    );
  };

  const handleSelectNone = () => {
    setSelectedPlayers(new Set());
  };

  // Virtual scrolling for streams
  useEffect(() => {
    if (!isVisible || !containerRef.current) {
      setVisibleStreamIds(new Set());
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const newVisibleIds = new Set(visibleStreamIds);

        entries.forEach((entry) => {
          const playerId = entry.target.getAttribute("data-player-id");
          if (!playerId) return;

          if (entry.isIntersecting) {
            newVisibleIds.add(playerId);
          } else {
            newVisibleIds.delete(playerId);
          }
        });

        setVisibleStreamIds(newVisibleIds);
      },
      {
        root: containerRef.current,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    const streamElements =
      containerRef.current.querySelectorAll("[data-player-id]");
    streamElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [isVisible, playersToStream, visibleStreamIds]);

  // Cleanup streams when not visible
  useEffect(() => {
    if (!isVisible) {
      setVisibleStreamIds(new Set());
      setStreamStates(new Map());
    }
  }, [isVisible]);

  const getPlayerStatusBadges = (player: PlayerData) => {
    const badges = [];

    if (player.threatScore !== undefined) {
      badges.push(
        <TooltipProvider key="threat">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`text-[10px] px-1 py-0 h-4 border-current cursor-help ${getThreatScoreColor(
                  player.threatScore || 0,
                  false
                )}`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mr-0.5 ${getThreatScoreColor(
                    player.threatScore || 0,
                    true
                  )}`}
                />
                {player.threatScore}/100
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("threat_score_tooltip")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (player.admin) {
      badges.push(
        <TooltipProvider key="admin">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-[10px] px-1 py-0 h-4 cursor-help"
              >
                <Shield className="h-2 w-2 mr-0.5" />
                {t("admin")}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("admin_tooltip")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (player.timeOnline < 30) {
      badges.push(
        <TooltipProvider key="recent">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="text-[10px] px-1 py-0 h-4 cursor-help"
              >
                <Clock className="h-2 w-2 mr-0.5" />
                {t("just_joined")}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("just_joined_tooltip")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if ((player.playTime || 0) < 60) {
      badges.push(
        <TooltipProvider key="low-time">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="default"
                className="text-[10px] px-1 py-0 h-4 cursor-help"
              >
                {t("low_playtime")}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("low_playtime_tooltip")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return badges;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Ping helper functions
  const getPingColor = (ping: number) => {
    if (ping <= 0) return "text-red-500";
    if (ping <= 50) return "text-green-500";
    if (ping <= 100) return "text-yellow-500";
    return "text-orange-500";
  };

  const getPingIcon = (ping: number) => {
    if (ping <= 0) return <WifiOff className="h-3 w-3" />;
    if (ping <= 50) return <Wifi className="h-3 w-3" />;
    if (ping <= 100) return <WifiHigh className="h-3 w-3" />;
    return <WifiLow className="h-3 w-3" />;
  };

  if (!isVisible) return null;

  return (
    <div className="h-full flex">
      {/* Main Stream Area */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isMobile ? "" : isSidebarCollapsed ? "mr-12" : "mr-80"
        }`}
      >
        <div
          ref={containerRef}
          className="h-full overflow-y-auto p-2 md:p-4 md:pt-2 [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:bg-transparent"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {playersToStream.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              {filteredAndSortedPlayers.length === 0 ? (
                <>
                  <h3 className="text-xl font-semibold">
                    {t("no_players_match_filters")}
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {t("no_players_match_filters_description")}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold">
                    {t("no_players_selected")}
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {t("no_players_selected_description")}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div
              className={`grid gap-2 md:gap-2 ${
                isMobile
                  ? "grid-cols-1"
                  : layout.cols === 1
                  ? "grid-cols-1"
                  : layout.cols === 2
                  ? "grid-cols-2"
                  : layout.cols === 3
                  ? "grid-cols-3"
                  : "grid-cols-4"
              }`}
            >
              {playersToStream.map((player) => {
                const isVisible = visibleStreamIds.has(player.id.toString());
                const isStreaming =
                  streamStates.get(player.id.toString()) || false;
                const playerId = player.id.toString();

                const stableHandler = playerStreamHandlers.get(playerId);

                return (
                  <div
                    key={player.id}
                    data-player-id={player.id.toString()}
                    className="w-full bg-background border rounded-lg overflow-hidden"
                  >
                    {/* Compact player header */}
                    <div className="px-2 py-1 border-b bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate">
                          #{player.id} {player.name}
                        </span>
                        <div className="flex items-center">
                          <div
                            className={`flex items-center gap-1 ${getPingColor(
                              player.ping
                            )}`}
                          >
                            {getPingIcon(player.ping)}
                            <span className="text-xs font-mono">
                              {player.ping <= 0
                                ? t("ping_off")
                                : `${player.ping}ms`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {getPlayerStatusBadges(player)}
                      </div>
                    </div>

                    {/* Stream container */}
                    <div className="w-full">
                      {isVisible ? (
                        <StreamViewer
                          serverId={serverId}
                          playerId={playerId}
                          playerName={player.name}
                          playerLicense={player.license}
                          onStreamStateChange={stableHandler}
                          className="w-full rounded-none"
                        />
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center bg-muted rounded-lg">
                          <div className="text-center">
                            <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              {serverId === "demo" ? "Click to start demo stream" : t("scroll_to_load_stream")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      {isMobile && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="fixed top-16 right-2 z-50 md:hidden"
        >
          <Users className="h-4 w-4" />
        </Button>
      )}

      {/* Player Sidebar */}
      <div
        className={`fixed right-2 top-16 h-[calc(100vh-4.5rem)] transition-all duration-300 z-40 ${
          isMobile
            ? isSidebarCollapsed
              ? "w-0 opacity-0 pointer-events-none"
              : "w-80"
            : isSidebarCollapsed
            ? "w-12"
            : "w-80"
        } flex flex-col ${isMobile ? "md:flex" : ""}`}
      >
        <div className="bg-sidebar border-sidebar-border text-sidebar-foreground flex h-full w-full flex-col rounded-lg border">
          {/* Sidebar Header */}
          <div className="flex flex-col gap-2 p-2">
            <div className="flex items-center justify-between">
              {!isSidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <h3 className="text-sm font-medium">{t("players")}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {stablePlayers.length}
                  </Badge>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="h-6 w-6 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                {isSidebarCollapsed ? (
                  <ChevronLeft className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {!isSidebarCollapsed && (
            <>
              {/* Search and Controls */}
              <div className="flex flex-col gap-2 p-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-sidebar-foreground/70" />
                  <Input
                    placeholder={t("search_placeholder")}
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    className="pl-9 h-7 bg-sidebar-accent/50 border-sidebar-border text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/70"
                  />
                </div>

                {/* Sort */}
                <div className="flex gap-1">
                  <Select
                    value={sortField}
                    onValueChange={(value: SortField) => setSortField(value)}
                  >
                    <SelectTrigger className="h-7 text-xs bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">
                        {t("sort_field_name")}
                      </SelectItem>
                      <SelectItem value="playtime">
                        {t("sort_field_playtime")}
                      </SelectItem>
                      <SelectItem value="threatScore">
                        {t("sort_field_threat_score")}
                      </SelectItem>
                      <SelectItem value="timeOnline">
                        {t("sort_field_join_time")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                    }
                    className="bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    {sortDirection === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {/* Select All/None */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-6 text-xs flex-1 bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    {t("select_all")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectNone}
                    className="h-6 text-xs flex-1 bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    {t("select_none")}
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-2 p-2 border-t border-sidebar-border">
                <div className="flex items-center gap-1 mb-1">
                  <Filter className="h-3 w-3" />
                  <span className="text-xs font-medium text-sidebar-foreground/70">
                    {t("filters")}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recent"
                      checked={filters.showRecentlyJoined}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({
                          ...prev,
                          showRecentlyJoined: checked === true,
                        }))
                      }
                      className="data-[state=checked]:bg-sidebar-accent data-[state=checked]:border-sidebar-accent"
                    />
                    <Label
                      htmlFor="recent"
                      className="text-xs text-sidebar-foreground"
                    >
                      {t("recently_joined")}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="new"
                      checked={filters.showLowPlaytime}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({
                          ...prev,
                          showLowPlaytime: checked === true,
                        }))
                      }
                      className="data-[state=checked]:bg-sidebar-accent data-[state=checked]:border-sidebar-accent"
                    />
                    <Label
                      htmlFor="new"
                      className="text-xs text-sidebar-foreground"
                    >
                      {t("new_players")}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="threats"
                      checked={filters.showPotentialThreats}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({
                          ...prev,
                          showPotentialThreats: checked === true,
                        }))
                      }
                      className="data-[state=checked]:bg-sidebar-accent data-[state=checked]:border-sidebar-accent"
                    />
                    <Label
                      htmlFor="threats"
                      className="text-xs text-sidebar-foreground"
                    >
                      {t("potential_threats")}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="admins"
                      checked={filters.showAdmins}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({
                          ...prev,
                          showAdmins: checked === true,
                        }))
                      }
                      className="data-[state=checked]:bg-sidebar-accent data-[state=checked]:border-sidebar-accent"
                    />
                    <Label
                      htmlFor="admins"
                      className="text-xs text-sidebar-foreground"
                    >
                      {t("admins")}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Player List */}
              <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2 border-t [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:bg-transparent [&::-webkit-scrollbar-track]:bg-sidebar-accent/10 [&::-webkit-scrollbar-thumb]:bg-sidebar-accent/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-sidebar-accent/70">
                {filteredAndSortedPlayers.map((player) => {
                  const isSelected = selectedPlayers.has(player.id.toString());

                  return (
                    <div
                      key={player.id}
                      className={`relative flex w-full min-w-0 min-h-[50px] items-start gap-2 overflow-hidden rounded-md p-2 text-left text-xs outline-hidden ring-sidebar-ring transition-colors hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground focus-visible:ring-2 cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-l-2 border-l-primary text-sidebar-foreground"
                          : "text-sidebar-foreground"
                      }`}
                      onClick={() =>
                        handlePlayerSelect(player.id.toString(), !isSelected)
                      }
                    >
                      <div className="flex flex-col w-full min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-xs text-sidebar-foreground/70 font-mono">
                              #{player.id}
                            </span>
                            <div className="text-xs font-medium truncate">
                              {player.name}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {getPlayerStatusBadges(player)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

