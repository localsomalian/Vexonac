// GTA V coordinate conversion utilities for Leaflet integration
// Based on working OpenLayers implementation that properly centers at 0,0

// Scale factor from the working OpenLayers implementation
const SCALE = (0.0207 + 0.0205) / 2;

// Extent calculations from the working implementation
// These values properly position the GTA V world within the tile system
export const GTA_EXTENT = {
  minX: -117.3 / SCALE,
  minY: (172.8 - 256) / SCALE,
  maxX: (256 - 117.3) / SCALE,
  maxY: 172.8 / SCALE,
};

// Map tile configuration
export const MAP_CONFIG = {
  tileSize: 256,
  maxZoom: 5,
  scale: SCALE,
};

// Calculate world dimensions
const WORLD_WIDTH = GTA_EXTENT.maxX - GTA_EXTENT.minX;
const WORLD_HEIGHT = GTA_EXTENT.maxY - GTA_EXTENT.minY;

/**
 * Convert GTA V world coordinates to Leaflet coordinates
 * This now properly centers 0,0 at the actual center of Los Santos
 * @param x GTA V X coordinate
 * @param y GTA V Y coordinate
 * @returns [lat, lng] for Leaflet CRS.Simple
 */
export function gtaToLeaflet(x: number, y: number): [number, number] {
  // Normalize to 0-1 range within the extent (work directly with GTA coordinates)
  const normalizedX = (x - GTA_EXTENT.minX) / WORLD_WIDTH;
  const normalizedY = (y - GTA_EXTENT.minY) / WORLD_HEIGHT;

  // Convert to pixel coordinates for Leaflet
  // In CRS.Simple, [0,0] is top-left, so we need to flip Y
  const pixelX = normalizedX * MAP_CONFIG.tileSize;
  const pixelY = (1 - normalizedY) * MAP_CONFIG.tileSize;

  // Return as [lat, lng] which is [y, x] in CRS.Simple
  return [pixelY, pixelX];
}

/**
 * Convert Leaflet coordinates to GTA V world coordinates
 * @param lat Leaflet latitude (Y in CRS.Simple)
 * @param lng Leaflet longitude (X in CRS.Simple)
 * @returns [x, y] GTA V coordinates
 */
export function leafletToGta(lat: number, lng: number): [number, number] {
  // Convert from pixel coordinates to normalized 0-1 range
  const normalizedX = lng / MAP_CONFIG.tileSize;
  const normalizedY = 1 - lat / MAP_CONFIG.tileSize; // Flip Y back

  // Convert directly to GTA world coordinates using the extent
  const x = normalizedX * WORLD_WIDTH + GTA_EXTENT.minX;
  const y = normalizedY * WORLD_HEIGHT + GTA_EXTENT.minY;

  return [x, y];
}

/**
 * Get map center in Leaflet coordinates (GTA V origin 0,0)
 */
export function getMapCenter(): [number, number] {
  return gtaToLeaflet(0, 0);
}

/**
 * Get map bounds for Leaflet (covers the full extent)
 */
export function getMapBounds(): [[number, number], [number, number]] {
  return [
    [0, 0],
    [MAP_CONFIG.tileSize, MAP_CONFIG.tileSize],
  ];
}

/**
 * Debug function to get coordinate information
 */
export function getRawCoordinates(
  lat: number,
  lng: number
): { raw: [number, number]; gta: [number, number]; extent: string } {
  const [gtaX, gtaY] = leafletToGta(lat, lng);

  return {
    raw: [lng, lat], // Raw Leaflet coordinates [lng, lat]
    gta: [gtaX, gtaY], // GTA coordinates [x, y]
    extent: `X: ${GTA_EXTENT.minX.toFixed(1)} to ${GTA_EXTENT.maxX.toFixed(
      1
    )}, Y: ${GTA_EXTENT.minY.toFixed(1)} to ${GTA_EXTENT.maxY.toFixed(1)}`,
  };
}

// Popular GTA V locations with accurate coordinates
export const POPULAR_LOCATIONS = {
  "Map Center (0,0)": { x: 0, y: 0 },
  "Los Santos Airport": { x: -1037.5, y: -2674.5 },
  "Vinewood Sign": { x: -290.0, y: 2549.0 },
  "Mount Chiliad": { x: 501.0, y: 5593.0 },
  "Del Perro Pier": { x: -1681.0, y: -1027.0 },
  "Maze Bank Tower": { x: -75.0, y: -818.0 },
  "Fort Zancudo": { x: -2360.0, y: 3249.0 },
  "Sandy Shores": { x: 1570.0, y: 3614.0 },
  "Paleto Bay": { x: -448.0, y: 6006.0 },
  Prison: { x: 1845.0, y: 2586.0 },
} as const;

export type LocationName = keyof typeof POPULAR_LOCATIONS;
