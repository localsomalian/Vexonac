"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import L from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet/dist/leaflet.css";
import { Camera, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Rectangle,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { getThreatScoreColor } from "@/lib/utils";
import { gtaToLeaflet, leafletToGta, MAP_CONFIG } from "./coordinate-utils";
import {
  type GtaCoordinates,
  type GtaMapProps,
  type MapClickEvent,
  type MapMarker,
  type MapSettings,
  type PlayerMarker,
  DEFAULT_MAP_SETTINGS,
  MAP_STYLES,
} from "./map-types";
import { HeatmapLayer } from "./heatmap-layer";

// Custom CSS to override Leaflet popup styling
const customPopupStyle = `
  .leaflet-popup-content-wrapper {
    background: transparent !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .leaflet-popup-content {
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
  }
  .leaflet-popup-tip {
    background: #1f2937 !important;
    border: none !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4) !important;
  }
`;

// Inject custom styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = customPopupStyle;
  document.head.appendChild(styleSheet);
}

// Custom Leaflet CRS for GTA V map
const GTACRS = L.extend({}, L.CRS.Simple, {
  transformation: new L.Transformation(1, 0, 1, 0),
});

// Custom marker icons based on marker type
const createCustomIcon = (marker: MapMarker, color?: string) => {
  const defaultColor = color || getMarkerColor(marker.type, marker);
  const symbol = getMarkerSymbol(marker.type, marker);

  const iconHtml = `
		<div style="
			background-color: ${defaultColor};
			width: 28px;
			height: 28px;
			border-radius: 50%;
			border: 2px solid white;
			box-shadow: 0 2px 6px rgba(0,0,0,0.4);
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;
			font-size: 14px;
			font-weight: bold;
		">
			${symbol}
		</div>
	`;

  return L.divIcon({
    html: iconHtml,
    className: "custom-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

const getMarkerSymbol = (type: string, marker?: MapMarker) => {
  // Check for custom icon first
  if (marker?.icon) {
    return marker.icon;
  }

  // For player markers, check if they're in a vehicle
  if (type === "player" && marker) {
    const playerMarker = marker as any;

    if (playerMarker.isAdmin) {
      return "🛡️"; // Crown for admins
    }
    if (playerMarker.inVehicle) {
      return "🚗"; // Vehicle icon for players in vehicles
    }

    return "🧑"; // Regular player icon
  }

  switch (type) {
    case "location":
      return "📍";
    case "custom":
      return "📌";
    default:
      return "●";
  }
};

const getMarkerColor = (type: string, marker?: MapMarker) => {
  if (type === "player" && marker) {
    const playerMarker = marker as any;

    // Admin players get a special color
    if (playerMarker.isAdmin) {
      return "#ff6b35"; // Modern orange-red for admins
    }

    // Players in vehicles get a different color
    if (playerMarker.inVehicle) {
      return "#6366f1"; // Modern indigo for players in vehicles
    }

    return "#22c55e"; // Modern green for regular players
  }

  switch (type) {
    case "player":
      return "#22c55e"; // Modern green
    case "location":
      return "#f97316"; // Modern orange
    case "custom":
      return "#a855f7"; // Modern purple
    default:
      return "#64748b"; // Modern slate gray
  }
};

// Component to get map reference using useMap hook
function MapReferenceHandler({
  onMapReady,
}: {
  onMapReady?: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
}

// Component to handle map events
function MapEventHandler({
  onMapClick,
  onZoomChange,
  onCenterChange,
  onAreaSelection,
}: {
  onMapClick?: (event: MapClickEvent) => void;
  onZoomChange?: (zoom: number) => void;
  onCenterChange?: (center: { x: number; y: number }) => void;
  onAreaSelection?: (bounds: {
    topLeft: GtaCoordinates;
    bottomRight: GtaCoordinates;
  }) => void;
}) {
  const map = useMapEvents({
    click: (e) => {
      if (!onMapClick) return;

      const leafletCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
      const [x, y] = leafletToGta(e.latlng.lat, e.latlng.lng);
      const gtaCoords = { x, y };

      onMapClick({
        gtaCoordinates: gtaCoords,
        leafletCoordinates: leafletCoords,
        originalEvent: e,
      });
    },
    zoomend: () => {
      onZoomChange?.(map.getZoom());
    },
    moveend: () => {
      const center = map.getCenter();
      const [x, y] = leafletToGta(center.lat, center.lng);
      onCenterChange?.({ x, y });
    },
  });

  // Area selection functionality
  useEffect(() => {
    if (!map || !onAreaSelection) return;

    let isSelecting = false;
    let startPoint: L.LatLng | null = null;
    let selectionRectangle: L.Rectangle | null = null;

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      if (e.originalEvent.shiftKey) {
        isSelecting = true;
        startPoint = e.latlng;
        map.dragging.disable();
        map.getContainer().style.cursor = "crosshair";
        e.originalEvent.preventDefault();
      }
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (isSelecting && startPoint && e.originalEvent.shiftKey) {
        if (selectionRectangle) {
          map.removeLayer(selectionRectangle);
        }

        const bounds = L.latLngBounds(startPoint, e.latlng);
        selectionRectangle = L.rectangle(bounds, {
          color: "#dc2626",
          fillColor: "#dc2626",
          fillOpacity: 0.15,
          weight: 2,
          dashArray: "5, 5",
        });
        selectionRectangle.addTo(map);
      }
    };

    const handleMouseUp = (e: L.LeafletMouseEvent) => {
      if (isSelecting && startPoint && selectionRectangle) {
        // Calculate GTA coordinates for the selection bounds
        const bounds = selectionRectangle.getBounds();
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();

        const [topLeftX, topLeftY] = leafletToGta(southWest.lat, southWest.lng);
        const [bottomRightX, bottomRightY] = leafletToGta(
          northEast.lat,
          northEast.lng
        );

        onAreaSelection({
          topLeft: { x: topLeftX, y: topLeftY },
          bottomRight: { x: bottomRightX, y: bottomRightY },
        });

        // Clean up
        map.removeLayer(selectionRectangle);
        selectionRectangle = null;
      }

      // Reset selection state
      isSelecting = false;
      startPoint = null;
      map.dragging.enable();
      map.getContainer().style.cursor = "";
    };

    // Add event listeners
    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);

    // Cleanup
    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      if (selectionRectangle) {
        map.removeLayer(selectionRectangle);
      }
    };
  }, [map, onAreaSelection]);

  return null;
}

// Component to update map center when settings change
function MapController({
  center,
  zoom,
}: {
  center: { x: number; y: number };
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    const [lat, lng] = gtaToLeaflet(center.x, center.y);
    map.setView([lat, lng], zoom);
  }, [map, center.x, center.y, zoom]);

  return null;
}

// Component to render persistent selected area rectangle
function SelectedAreaRectangle({
  selectedArea,
}: {
  selectedArea: {
    topLeft: GtaCoordinates;
    bottomRight: GtaCoordinates;
  } | null;
}) {
  if (!selectedArea) return null;

  // Convert GTA coordinates to Leaflet coordinates
  const [topLeftLat, topLeftLng] = gtaToLeaflet(
    selectedArea.topLeft.x,
    selectedArea.topLeft.y
  );
  const [bottomRightLat, bottomRightLng] = gtaToLeaflet(
    selectedArea.bottomRight.x,
    selectedArea.bottomRight.y
  );

  // Create bounds for the rectangle
  const bounds: [[number, number], [number, number]] = [
    [topLeftLat, topLeftLng],
    [bottomRightLat, bottomRightLng],
  ];

  return (
    <Rectangle
      bounds={bounds}
      pathOptions={{
        color: "#dc2626",
        fillColor: "#dc2626",
        fillOpacity: 0.15,
        weight: 2,
        dashArray: "10, 5",
      }}
    />
  );
}

// Main GTA Map Component
export function GtaMap({
  markers = [],
  settings: propSettings,
  selectedArea,
  eventHandlers,
  onSpectateClick,
  onScreenshotClick,
  serverId,
  className = "",
  height = "600px",
  width = "100%",
  loading = false,
  onMapReady,
}: GtaMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  const [settings, setSettings] = useState<MapSettings>({
    ...DEFAULT_MAP_SETTINGS,
    ...propSettings,
  });

  // Update settings when props change
  useEffect(() => {
    setSettings((prev) => ({ ...prev, ...propSettings }));
  }, [propSettings]);

  // Map center in Leaflet coordinates
  const mapCenter = gtaToLeaflet(settings.center.x, settings.center.y);
  const currentMapStyle = MAP_STYLES[settings.style] || MAP_STYLES.atlas;

  // Create reactive style object for MapContainer
  const mapContainerStyle = useMemo(
    () => ({
      height: "100%",
      width: "100%",
      backgroundColor: "transparent",
    }),
    []
  );

  // Get background color for wrapper div
  const wrapperBackgroundColor =
    settings.style === "satellite"
      ? "#153E6A"
      : settings.style === "grid"
      ? "#8F9190"
      : "#0CA9D2";

  // Handle map click events
  const handleMapClick = useCallback(
    (event: MapClickEvent) => {
      eventHandlers?.onMapClick?.(event);
    },
    [eventHandlers]
  );

  // Handle marker click events
  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      return (e: L.LeafletMouseEvent) => {
        eventHandlers?.onMarkerClick?.(marker, e);
      };
    },
    [eventHandlers]
  );

  // Memoize heatmap points to prevent unnecessary recalculations
  const heatmapPoints = useMemo(() => 
    markers
      .filter(marker => marker && marker.coords && marker.type === 'player')
      .map(marker => marker.coords),
    [markers]
  );

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      style={{
        height: typeof height === "string" ? height : `${height}px`,
        width: typeof width === "string" ? width : `${width}px`,
        minHeight: "400px", // Ensure minimum height for Leaflet
        backgroundColor: wrapperBackgroundColor,
      }}
    >
      <MapContainer
        ref={mapRef}
        center={mapCenter}
        zoom={settings.zoom}
        crs={GTACRS}
        style={mapContainerStyle}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        className="rounded-lg overflow-hidden"
        minZoom={currentMapStyle.minZoom}
        maxZoom={currentMapStyle.maxZoom}
        maxBounds={[
          [0, 0],
          [MAP_CONFIG.tileSize, MAP_CONFIG.tileSize],
        ]}
        maxBoundsViscosity={1.0}
        attributionControl={false} // Remove attribution control
      >
        {/* Map Tiles */}
        <TileLayer
          url={currentMapStyle.tileUrl}
          attribution={currentMapStyle.attribution}
          tileSize={MAP_CONFIG.tileSize}
          noWrap={true}
          bounds={[
            [0, 0],
            [MAP_CONFIG.tileSize, MAP_CONFIG.tileSize],
          ]}
          errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVHic7dMxAQAwCAOw+t+dJm8hDJiuEwA+Z1cA3jEA6BgAdAwAOgYAHQOAjgFAxwCgYwDQMQDoGAB0DAA6BgAdA4COAUDHAAA="
        />

        {/* Map Event Handler */}
        <MapEventHandler
          onMapClick={handleMapClick}
          onZoomChange={eventHandlers?.onZoomChange}
          onCenterChange={eventHandlers?.onCenterChange}
          onAreaSelection={eventHandlers?.onAreaSelection}
        />

        {/* Map Controller */}
        <MapController center={settings.center} zoom={settings.zoom} />

        {/* Map Reference Handler */}
        <MapReferenceHandler onMapReady={onMapReady} />

        {/* Selected Area Rectangle */}
        <SelectedAreaRectangle selectedArea={selectedArea || null} />

        {/* Heatmap Layer */}
        {settings.heatmap?.enabled && (
          <HeatmapLayer
            points={heatmapPoints}
            settings={settings.heatmap}
          />
        )}

        {/* Markers - hide when heatmap is enabled */}
        {!settings.heatmap?.enabled && markers.map((marker) => {
          const [lat, lng] = gtaToLeaflet(marker.coords.x, marker.coords.y);
          const icon = createCustomIcon(
            marker,
            getMarkerColor(marker.type, marker)
          );

          return (
            <Marker
              key={marker.id}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{
                click: handleMarkerClick(marker),
                add: (e) => {
                  // Store player data in marker options for later reference
                  e.target.options.playerData = marker;
                  e.target.options.markerId = marker.id;
                },
              }}
            >
              <Popup>
                <div className="min-w-[200px] p-0">
                  <Card className="border-0 gap-2">
                    <CardHeader>
                      <div className="flex items-center justify-between overflow-hidden">
                        <CardTitle className="text-sm font-semibold flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                          {marker.type === "player" && (
                            <span className="text-muted-foreground text-xs flex-shrink-0">
                              #{marker.id}
                            </span>
                          )}
                          <span className="truncate flex-1 min-w-0">
                            {marker.name}
                          </span>
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {/* Coordinates */}
                      <div className="bg-muted/50 rounded-md p-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Coordinates
                        </div>
                        <div className="font-mono text-sm space-y-0.5">
                          <div>X: {marker.coords.x.toFixed(2)}</div>
                          <div>Y: {marker.coords.y.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Player-specific info */}
                      {marker.type === "player" && (
                        <div className="space-y-2">
                          <div className="space-y-2">
                            {(marker as PlayerMarker).admin && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">
                                  Role:
                                </span>
                                <Badge className="text-xs bg-orange-100 text-orange-800">
                                  🛡️ Administrator
                                </Badge>
                              </div>
                            )}

                            {(marker as PlayerMarker).playTime && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">
                                  Playtime:
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {Math.floor(
                                    (marker as PlayerMarker).playTime / 60
                                  )}
                                  h{" "}
                                  {Math.floor(
                                    (marker as PlayerMarker).playTime % 60
                                  )}
                                  m
                                </span>
                              </div>
                            )}

                            {(marker as PlayerMarker).threatScore >= 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">
                                  Threat Score:
                                </span>
                                <div className="flex items-center gap-1 cursor-help">
                                  <div
                                    className={`w-2 h-2 rounded-full ${getThreatScoreColor(
                                      (marker as PlayerMarker).threatScore,
                                      true
                                    )}`}
                                  />
                                  <span
                                    className={`text-xs font-mono ${getThreatScoreColor(
                                      (marker as PlayerMarker).threatScore,
                                      false
                                    )}`}
                                  >
                                    {(marker as PlayerMarker).threatScore}/100
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Lookup Button */}
                          {serverId && marker.license && (
                            <Button asChild variant="outline" size="sm" className="w-full mt-2">
                              <Link
                                href={`/dashboard/server/${serverId}/lookup?license=${marker.license}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View in Lookup
                              </Link>
                            </Button>
                          )}

                          {/* Action Buttons */}
                          {(onSpectateClick || onScreenshotClick) && (
                            <div className="flex gap-2 mt-2">
                              {onSpectateClick && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSpectateClick(marker);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Spectate
                                </Button>
                              )}
                              {onScreenshotClick && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onScreenshotClick(marker);
                                  }}
                                >
                                  <Camera className="h-3 w-3 mr-1" />
                                  Screenshot
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

// Mini Map Component for Player Position
export function PlayerMiniMap({
  coords,
  playerName,
}: {
  coords: { x: number; y: number };
  playerName: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative w-full h-full bg-slate-900 rounded overflow-hidden flex items-center justify-center">
        <div className="text-sm text-white/60">Loading map...</div>
      </div>
    );
  }

  // Convert player coordinates to Leaflet coordinates
  const [lat, lng] = gtaToLeaflet(coords.x, coords.y);
  const mapCenter: [number, number] = [lat, lng];

  // Get atlas map style (same as main map)
  const currentMapStyle = MAP_STYLES.atlas;

  // Create player marker icon
  const playerIcon = L.divIcon({
    html: `
      <div style="
        background-color: #ef4444;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
      "></div>
    `,
    className: "custom-mini-marker",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <div className="relative w-full h-full rounded overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={3}
        crs={GTACRS}
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: "#0CA9D2",
        }}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        keyboard={true}
        boxZoom={true}
        touchZoom={true}
        attributionControl={false}
        minZoom={currentMapStyle.minZoom}
        maxZoom={currentMapStyle.maxZoom}
        maxBounds={[
          [0, 0],
          [MAP_CONFIG.tileSize, MAP_CONFIG.tileSize],
        ]}
        maxBoundsViscosity={1.0}
      >
        {/* Map Tiles */}
        <TileLayer
          url={currentMapStyle.tileUrl}
          attribution={currentMapStyle.attribution}
          tileSize={MAP_CONFIG.tileSize}
          noWrap={true}
          bounds={[
            [0, 0],
            [MAP_CONFIG.tileSize, MAP_CONFIG.tileSize],
          ]}
        />

        {/* Player Marker */}
        <Marker position={mapCenter} icon={playerIcon}>
          <Tooltip
            permanent={true}
            direction="top"
            offset={[0, -10]}
            className="!bg-black/90 !text-white !border-none !rounded !text-xs !font-medium !shadow-lg !p-2"
          >
            {playerName}
          </Tooltip>
        </Marker>
      </MapContainer>
    </div>
  );
}
