// Type definitions for GTA V interactive map

import type { PlayerStatus } from "@vexonac/types";

export interface GtaCoordinates {
  x: number;
  y: number;
}

export interface LeafletCoordinates {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  coords: GtaCoordinates;
  name: string;
  type: MarkerType;
  icon?: string;
  color?: string;
  license?: string;
}

export interface PlayerMarker extends MapMarker {
  type: "player";
  playTime: number;
  threatScore: number;
  ping: number;
  health: number;
  status: PlayerStatus;
  timeOnline: number;
  admin: boolean;
  license: string;
}

export interface CustomMarker extends MapMarker {
  type: "custom";
  category?: string;
}

export type MarkerType = "player" | "custom" | "location";

export interface MapStyle {
  id: string;
  name: string;
  displayName: string;
  tileUrl: string;
  attribution: string;
  minZoom: number;
  maxZoom: number;
}

export interface HeatmapSettings {
  enabled: boolean;
  radius: number;
  blur: number;
  maxZoom: number;
  minOpacity: number;
  gradient?: { [key: number]: string };
}

export interface MapSettings {
  center: GtaCoordinates;
  zoom: number;
  style: string;
  showGrid: boolean;
  showCoordinates: boolean;
  heatmap: HeatmapSettings;
}

export interface MapClickEvent {
  gtaCoordinates: GtaCoordinates;
  leafletCoordinates: LeafletCoordinates;
  originalEvent: L.LeafletMouseEvent;
}

// Map event handlers
export interface MapEventHandlers {
  onMapClick?: (event: MapClickEvent) => void;
  onMarkerClick?: (marker: MapMarker, event: L.LeafletMouseEvent) => void;
  onMarkerAdd?: (marker: MapMarker) => void;
  onMarkerRemove?: (markerId: string) => void;
  onZoomChange?: (zoom: number) => void;
  onCenterChange?: (center: GtaCoordinates) => void;
  onAreaSelection?: (bounds: {
    topLeft: GtaCoordinates;
    bottomRight: GtaCoordinates;
  }) => void;
}

// Props for the main map component
export interface GtaMapProps {
  markers?: MapMarker[];
  settings?: Partial<MapSettings>;
  selectedArea?: {
    topLeft: GtaCoordinates;
    bottomRight: GtaCoordinates;
  } | null;
  eventHandlers?: MapEventHandlers;
  onSpectateClick?: (marker: MapMarker) => void;
  onScreenshotClick?: (marker: MapMarker) => void;
  serverId?: string;
  className?: string;
  height?: string | number;
  width?: string | number;
  loading?: boolean;
  onMapReady?: (map: any) => void;
}

// Available map styles
export const MAP_STYLES: Record<string, MapStyle> = {
  atlas: {
    id: "atlas",
    name: "atlas",
    displayName: "Atlas",
    tileUrl: "/map-tiles/atlas/{z}/{x}/{y}.jpg",
    attribution: "GTA V Map",
    minZoom: 0,
    maxZoom: 5,
  },
  satellite: {
    id: "satellite",
    name: "satellite",
    displayName: "Satellite",
    tileUrl: "/map-tiles/satelite/{z}/{x}/{y}.jpg",
    attribution: "GTA V Map",
    minZoom: 0,
    maxZoom: 5,
  },
  grid: {
    id: "grid",
    name: "grid",
    displayName: "Grid",
    tileUrl: "/map-tiles/grid/{z}/{x}/{y}.png",
    attribution: "GTA V Map",
    minZoom: 0,
    maxZoom: 5,
  },
};

// Default heatmap settings
export const DEFAULT_HEATMAP_SETTINGS: HeatmapSettings = {
  enabled: false,
  radius: 30,
  blur: 20,
  maxZoom: 18, // High value to prevent zoom-based radius changes
  minOpacity: 0.6,
  gradient: {
    0.2: 'blue',
    0.4: 'cyan',
    0.6: 'lime',
    0.8: 'yellow',
    1.0: 'red'
  }
};

// Default map settings
export const DEFAULT_MAP_SETTINGS: MapSettings = {
  center: { x: 0, y: 0 },
  zoom: 3,
  style: "atlas",
  showGrid: false,
  showCoordinates: true,
  heatmap: DEFAULT_HEATMAP_SETTINGS,
};

