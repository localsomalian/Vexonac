"use client";

import { webSocketService } from "@/lib/websocket";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { type PlayerData } from "@vexonac/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gtaToLeaflet } from "./coordinate-utils";
import { GtaMap } from "./gta-map";
import { MapControls, type PlayerFilterType } from "./map-controls";
import {
  DEFAULT_MAP_SETTINGS,
  type GtaCoordinates,
  type MapClickEvent,
  type MapMarker,
  type MapSettings,
} from "./map-types";
import { PlayerList } from "./player-list";

// Hook to detect mobile devices
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}

// LocalStorage keys for persistence
const STORAGE_KEYS = {
  PLAYER_FILTER: "gta-map-player-filter",
  PLAYER_FILTER_TYPE: "gta-map-player-filter-type",
  SELECTED_AREA: "gta-map-selected-area",
  HEATMAP_ENABLED: "gta-map-heatmap-enabled",
};

// Helper functions for localStorage
const saveToStorage = (key: string, value: any) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }
};

const loadFromStorage = (key: string, defaultValue: any = null) => {
  if (typeof window !== "undefined") {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn("Failed to load from localStorage:", error);
      return defaultValue;
    }
  }
  return defaultValue;
};

// Helper function to convert PlayerData to MapMarker
const playerDataToMapMarker = (player: PlayerData): MapMarker => ({
  ...player,
  id: player.id.toString(),
  type: "player" as const,
});

// Hook for server-side players with real-time Socket.io updates
const useServerPlayers = (serverId: string) => {
  const [players, setPlayers] = useState<PlayerData[]>([]);

  // Fetch initial players from server
  const {
    data: serverPlayers,
    isLoading,
    refetch,
  } = useQuery(
    trpc.servers.getCurrentPlayers.queryOptions(
      { serverId },
      {
        enabled: !!serverId,
        refetchInterval: 5000,
      }
    )
  );

  // Use server player data directly
  useEffect(() => {
    if (serverPlayers) {
      setPlayers(serverPlayers);
    }
  }, [serverPlayers]);

  // Subscribe to real-time Socket.io updates (optimized - only on mount/unmount)
  useEffect(() => {
    if (!serverId) return;
    webSocketService.subscribeToServer(serverId);

    return () => {
      webSocketService.unsubscribeFromServer(serverId);
    };
  }, [serverId]);

  return { players, isLoading };
};

export interface InteractiveGtaMapProps {
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onSpectateClick?: (marker: MapMarker) => void;
  onScreenshotClick?: (marker: MapMarker) => void;
  height?: string | number;
  initialSettings?: Partial<MapSettings>;
  mockPlayers?: MapMarker[];
  serverId?: string;
}

export function InteractiveGtaMap({
  markers = [],
  onMarkerClick,
  onSpectateClick,
  onScreenshotClick,
  height = "100dvh",
  initialSettings,
  mockPlayers = [],
  serverId,
}: InteractiveGtaMapProps) {
  const t = useScopedI18n("interactive_map");
  const [mounted, setMounted] = useState(false);

  // Use backend players instead of mockPlayers
  const { players: backendPlayers, isLoading: playersLoading } =
    useServerPlayers(serverId || "default");

  // Initialize filter states from localStorage
  const [playerFilter, setPlayerFilter] = useState(() =>
    loadFromStorage(STORAGE_KEYS.PLAYER_FILTER, "")
  );
  const [playerFilterType, setPlayerFilterType] = useState<PlayerFilterType>(
    () => loadFromStorage(STORAGE_KEYS.PLAYER_FILTER_TYPE, "none")
  );

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set()
  );
  const [mapRef, setMapRef] = useState<any>(null);
  const [playerMarkers, setPlayerMarkers] = useState<Map<string, any>>(
    new Map()
  );

  // Area selection state - persist the selection area and load from localStorage
  const [selectedArea, setSelectedArea] = useState<{
    topLeft: GtaCoordinates;
    bottomRight: GtaCoordinates;
  } | null>(() => loadFromStorage(STORAGE_KEYS.SELECTED_AREA, null));

  // Alternative approach: Use a ref to store map instance
  const mapInstanceRef = useRef<any>(null);

  const isMobile = useIsMobile();

  // Load cached map style or use default
  const getCachedStyle = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const cachedStyle = localStorage.getItem("gta-map-style");
        return cachedStyle || DEFAULT_MAP_SETTINGS.style;
      } catch (error) {
        console.warn("Failed to load cached map style:", error);
        return DEFAULT_MAP_SETTINGS.style;
      }
    }
    return DEFAULT_MAP_SETTINGS.style;
  }, []);

  const [settings, setSettings] = useState<MapSettings>(() => {
    // Load heatmap state from localStorage
    const savedHeatmapEnabled = loadFromStorage(STORAGE_KEYS.HEATMAP_ENABLED, false);
    
    return {
      ...DEFAULT_MAP_SETTINGS,
      showCoordinates: false, // Don't show the coordinate helper overlay
      style: getCachedStyle(), // Load cached style
      heatmap: {
        ...DEFAULT_MAP_SETTINGS.heatmap,
        enabled: savedHeatmapEnabled,
      },
      ...initialSettings,
    };
  });

  // Save map style to cache when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("gta-map-style", settings.style);
      } catch (error) {
        console.warn("Failed to save map style to cache:", error);
      }
    }
  }, [settings.style]);

  // Save heatmap state to localStorage when it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HEATMAP_ENABLED, settings.heatmap?.enabled || false);
  }, [settings.heatmap?.enabled]);

  const [currentPositionMarker, setCurrentPositionMarker] =
    useState<MapMarker | null>(null);

  // Ensure component is mounted before rendering map
  useEffect(() => {
    setMounted(true);
  }, []);

  // Save filter states to localStorage when they change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PLAYER_FILTER, playerFilter);
  }, [playerFilter]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PLAYER_FILTER_TYPE, playerFilterType);
  }, [playerFilterType]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SELECTED_AREA, selectedArea);
  }, [selectedArea]);

  // Filter players based on search criteria and filter type
  const filteredPlayers = useMemo(() => {
    let filtered = backendPlayers;

    // If there's a selected area, first filter by area (zone takes precedence)
    if (selectedArea) {
      filtered = backendPlayers.filter((player) => {
        const { x, y } = player.coords;
        return (
          x >= Math.min(selectedArea.topLeft.x, selectedArea.bottomRight.x) &&
          x <= Math.max(selectedArea.topLeft.x, selectedArea.bottomRight.x) &&
          y >= Math.min(selectedArea.topLeft.y, selectedArea.bottomRight.y) &&
          y <= Math.max(selectedArea.topLeft.y, selectedArea.bottomRight.y)
        );
      });
    }

    // Apply type-based filters on top of area filtering
    if (playerFilterType !== "none") {
      filtered = filtered.filter((player) => {
        const playerData = player as PlayerData;

        switch (playerFilterType) {
          case "recently-connected":
            return playerData.timeOnline < 3600; // Less than 1 hour (3600 seconds)
          case "low-playtime":
            return playerData.playTime < 60; // Less than 60 minutes
          case "potential-threat":
            return playerData.threatScore >= 60;
          case "admins":
            return playerData.admin === true;
          default:
            return true;
        }
      });
    }

    // Apply text filter on top of area and type filtering
    if (playerFilter.trim()) {
      filtered = filtered.filter((player) => {
        const playerData = player as PlayerData;
        const matchesName = playerData.name
          ?.toLowerCase()
          .includes(playerFilter);
        const matchesId = playerData.id?.toString().includes(playerFilter);
        return matchesName || matchesId;
      });
    }

    return filtered;
  }, [backendPlayers, selectedArea, playerFilter, playerFilterType]);

  // Helper function to compare sets
  const setsEqual = (a: Set<string>, b: Set<string>) => {
    return a.size === b.size && [...a].every((x) => b.has(x));
  };

  const handleSettingsChange = useCallback(
    (newSettings: Partial<MapSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    []
  );

  const handleMapClick = useCallback((event: MapClickEvent) => {
    // Replace marker position marker when clicking on map
    const newMarker: MapMarker = {
      id: "marker-position",
      coords: event.gtaCoordinates,
      name: "Marker Position",
      type: "custom",
    };
    setCurrentPositionMarker(newMarker);
  }, []);

  const handlePlayerFilter = useCallback(
    (filterText: string) => {
      setPlayerFilter(filterText.toLowerCase());

      // Don't clear selection when there's a selected area - filters should apply within the area
      // Only clear manual selection when no area is selected
      if (!selectedArea) {
        setSelectedPlayerIds(new Set());
      }
    },
    [selectedArea]
  );

  const handlePlayerFilterTypeChange = useCallback(
    (filterType: PlayerFilterType) => {
      setPlayerFilterType(filterType);

      // Don't clear selection when there's a selected area - filters should apply within the area
      // Only clear manual selection when no area is selected
      if (!selectedArea) {
        setSelectedPlayerIds(new Set());
      }
    },
    [selectedArea]
  );

  // Handle map ready and store reference with multiple fallbacks
  const handleMapReady = useCallback((map: any) => {
    setMapRef(map);
    mapInstanceRef.current = map;
  }, []);

  const handlePlayerClick = useCallback(
    (player: MapMarker) => {
      const getMapFromDOM = () => {
        try {
          const mapContainer = document.querySelector(".leaflet-container");
          if (mapContainer && (mapContainer as any)._leaflet_map) {
            return (mapContainer as any)._leaflet_map;
          }
        } catch (e) {
          console.log("âŒ Error getting map from DOM:", e);
        }
        return null;
      };

      const domMap = getMapFromDOM();

      // Get the current map reference
      const currentMap = mapRef || mapInstanceRef.current || domMap;

      if (currentMap) {
        // Use Leaflet's native setView for immediate and proper centering
        const [lat, lng] = gtaToLeaflet(player.coords.x, player.coords.y);
        const targetZoom = Math.max(currentMap.getZoom(), 5);

        // Use flyTo for smooth animation and guaranteed centering
        currentMap.flyTo([lat, lng], targetZoom, {
          duration: 0.5, // Half second smooth animation
          easeLinearity: 0.25,
        });
      } else {
        setSettings((prev) => ({
          ...prev,
          center: player.coords,
          zoom: Math.max(prev.zoom, 5),
        }));
      }

      // Try to open popup using multiple approaches
      const attemptPopupOpen = (attempt: number = 0) => {
        if (attempt > 5) {
          return;
        }

        // Try all available map references
        const currentMap =
          mapRef || mapInstanceRef.current || domMap || getMapFromDOM();

        if (currentMap) {
          let foundMarker = false;
          let totalLayers = 0;

          // Enhanced layer search
          currentMap.eachLayer((layer: any) => {
            totalLayers++;

            if (layer.options?.markerId === player.id) {
              try {
                layer.openPopup();
                foundMarker = true;
              } catch (e) {
                console.log("âŒ Error opening popup by ID:", e);
              }
              return;
            }

            // Also try by player data
            if (layer.options?.playerData?.id === player.id) {
              try {
                layer.openPopup();
                foundMarker = true;
              } catch (e) {
                console.log("âŒ Error opening popup by playerData:", e);
              }
              return;
            }
          });

          if (!foundMarker) {
            setTimeout(() => attemptPopupOpen(attempt + 1), 100);
          }
        } else {
          console.log("âŒ No map reference available, retrying...");
          setTimeout(() => attemptPopupOpen(attempt + 1), 100); // Reduced delay from 200ms to 100ms
        }
      };

      // Start immediately since map reference is now working properly
      attemptPopupOpen();

      // Also call the onMarkerClick if provided
      onMarkerClick?.(player);
    },
    [onMarkerClick, mapRef]
  );

  const handlePlayerSelectionChange = useCallback((playerIds: Set<string>) => {
    setSelectedPlayerIds(playerIds);
  }, []);

  const handleAreaChange = useCallback(
    (
      area: {
        topLeft: GtaCoordinates;
        bottomRight: GtaCoordinates;
      } | null
    ) => {
      setSelectedArea(area);
    },
    []
  );

  // Area selection handler - now respects current filters
  const handleAreaSelection = useCallback(
    (bounds: { topLeft: GtaCoordinates; bottomRight: GtaCoordinates }) => {
      // Store the selected area for persistence (this replaces any existing area)
      setSelectedArea(bounds);
    },
    []
  );

  // Combine all markers (filtered players + other markers)
  const allMarkers = [
    ...markers,
    ...filteredPlayers.map(playerDataToMapMarker),
    ...(currentPositionMarker ? [currentPositionMarker] : []),
  ];

  // Add area marker if there's a selected area
  const areaMarker: MapMarker | null = selectedArea
    ? {
        id: "selected-area",
        coords: {
          x: (selectedArea.topLeft.x + selectedArea.bottomRight.x) / 2,
          y: (selectedArea.topLeft.y + selectedArea.bottomRight.y) / 2,
        },
        name: `Watch Zone (${selectedPlayerIds.size} players)`,
        type: "custom",
        icon: "â¬›",
        color: "#991b1b",
      }
    : null;

  const finalMarkers = [...allMarkers, ...(areaMarker ? [areaMarker] : [])];

  // Show loading until mounted
  if (!mounted) {
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center bg-muted">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
            <span className="text-sm">Loading map...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full z-0">
      {/* Full height map */}
      <div className="absolute inset-0 rounded-lg overflow-hidden z-0">
        <GtaMap
          markers={finalMarkers}
          settings={settings}
          selectedArea={selectedArea}
          eventHandlers={{
            onMapClick: handleMapClick,
            onMarkerClick: onMarkerClick,
            onAreaSelection: handleAreaSelection,
          }}
          onSpectateClick={onSpectateClick}
          onScreenshotClick={onScreenshotClick}
          serverId={serverId}
          height={height}
          width="100%"
          className="rounded-lg"
          onMapReady={handleMapReady}
        />
      </div>

      {/* Map Controls - show on all devices but make compact on mobile */}
      <MapControls
        settings={settings}
        currentPosition={currentPositionMarker?.coords}
        onSettingsChange={handleSettingsChange}
        onPlayerFilter={handlePlayerFilter}
        onPlayerFilterTypeChange={handlePlayerFilterTypeChange}
        playerCount={backendPlayers.length}
        filteredCount={filteredPlayers.length}
        playerFilterType={playerFilterType}
        isMobile={isMobile}
      />

      {/* Player List */}
      <PlayerList
        players={filteredPlayers.map(playerDataToMapMarker)}
        onPlayerClick={handlePlayerClick}
        totalPlayerCount={backendPlayers.length}
        isMobile={isMobile}
      />

      {/* Clear area selection button when there are selected players or a zone */}
      {(playerFilter || playerFilterType !== "none" || selectedArea) && (
        <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
          {/* Clear options */}
          <div className="flex gap-2">
            {/* Clear filters only (keep zone) */}
            {selectedArea && (playerFilter || playerFilterType !== "none") && (
              <button
                onClick={() => {
                  setPlayerFilter("");
                  setPlayerFilterType("none");
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Clear Filters Only
              </button>
            )}

            {/* Clear zone only (keep filters) */}
            {selectedArea && (playerFilter || playerFilterType !== "none") && (
              <button
                onClick={() => {
                  setSelectedArea(null);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Clear Zone Only
              </button>
            )}

            {/* Clear everything */}
            <button
              onClick={() => {
                setSelectedPlayerIds(new Set());
                setSelectedArea(null);
                setPlayerFilter("");
                setPlayerFilterType("none");
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span>
                Clear{" "}
                {selectedArea && (playerFilter || playerFilterType !== "none")
                  ? "All"
                  : selectedArea
                  ? "Zone"
                  : "Filters"}
                {filteredPlayers.length > 0 && ` (${filteredPlayers.length})`}
              </span>
            </button>
          </div>

          {/* Show current zone info when zone exists but no players */}
          {selectedArea && filteredPlayers.length === 0 && (
            <div className="bg-yellow-600/80 text-white px-3 py-2 rounded-md text-sm">
              Zone:{" "}
              {Math.abs(
                selectedArea.bottomRight.x - selectedArea.topLeft.x
              ).toFixed(0)}{" "}
              x{" "}
              {Math.abs(
                selectedArea.bottomRight.y - selectedArea.topLeft.y
              ).toFixed(0)}{" "}
              units
              <br />
              <span className="text-yellow-200">No players in zone</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Export a simple map component for basic usage
export function SimpleGtaMap({
  markers = [],
  center,
  zoom = 3,
  style = "atlas",
  height = "400px",
  className = "",
}: {
  markers?: MapMarker[];
  center?: GtaCoordinates;
  zoom?: number;
  style?: string;
  height?: string | number;
  className?: string;
}) {
  const settings: MapSettings = {
    center: center || { x: 0, y: 0 },
    zoom: zoom || DEFAULT_MAP_SETTINGS.zoom,
    style: style || DEFAULT_MAP_SETTINGS.style,
    showGrid: false,
    showCoordinates: false,
    heatmap: DEFAULT_MAP_SETTINGS.heatmap,
  };

  return (
    <GtaMap
      markers={markers}
      settings={settings}
      height={height}
      className={className}
    />
  );
}

