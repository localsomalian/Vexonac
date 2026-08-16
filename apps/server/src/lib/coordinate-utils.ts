// GTA V coordinate conversion utilities (server-side)
// Must match exactly with client-side coordinate-utils.ts

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
 * Check if a player position is within the selected area bounds
 * Uses the same coordinate system as the client-side map
 * @param playerPos Player position in GTA coordinates
 * @param selectedArea Area bounds in GTA coordinates (from client)
 * @returns True if player is within the area
 */
export function isPlayerInArea(
  playerPos: { x: number; y: number },
  selectedArea: {
    topLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  }
): boolean {
  const { x, y } = playerPos;

  // Calculate actual min/max bounds from topLeft and bottomRight
  const minX = Math.min(selectedArea.topLeft.x, selectedArea.bottomRight.x);
  const maxX = Math.max(selectedArea.topLeft.x, selectedArea.bottomRight.x);
  const minY = Math.min(selectedArea.topLeft.y, selectedArea.bottomRight.y);
  const maxY = Math.max(selectedArea.topLeft.y, selectedArea.bottomRight.y);

  // Check if player is within bounds
  const inArea = x >= minX && x <= maxX && y >= minY && y <= maxY;

  return inArea;
}

/**
 * Convert GTA V world coordinates to Leaflet coordinates
 * This matches the client-side implementation exactly
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
 * This matches the client-side implementation exactly
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
 * Debug function to compare coordinates and bounds
 */
export function debugAreaCheck(
  playerPos: { x: number; y: number },
  selectedArea: {
    topLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  }
): {
  player: { x: number; y: number };
  area: {
    topLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  inBounds: {
    x: boolean;
    y: boolean;
    overall: boolean;
  };
} {
  const minX = Math.min(selectedArea.topLeft.x, selectedArea.bottomRight.x);
  const maxX = Math.max(selectedArea.topLeft.x, selectedArea.bottomRight.x);
  const minY = Math.min(selectedArea.topLeft.y, selectedArea.bottomRight.y);
  const maxY = Math.max(selectedArea.topLeft.y, selectedArea.bottomRight.y);

  const inBoundsX = playerPos.x >= minX && playerPos.x <= maxX;
  const inBoundsY = playerPos.y >= minY && playerPos.y <= maxY;

  return {
    player: playerPos,
    area: {
      topLeft: selectedArea.topLeft,
      bottomRight: selectedArea.bottomRight,
      minX,
      maxX,
      minY,
      maxY,
    },
    inBounds: {
      x: inBoundsX,
      y: inBoundsY,
      overall: inBoundsX && inBoundsY,
    },
  };
}
