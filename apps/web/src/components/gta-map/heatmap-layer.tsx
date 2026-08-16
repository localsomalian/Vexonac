"use client";

import L from "leaflet";
import "leaflet.heat";
import { useEffect, useMemo, useRef } from "react";
import { useMap } from "react-leaflet";
import type { GtaCoordinates, HeatmapSettings } from "./map-types";
import { gtaToLeaflet } from "./coordinate-utils";

// Extend Leaflet types for heatmap
declare module "leaflet" {
  namespace DomUtil {
    function create(tagName: string, className?: string, container?: HTMLElement): HTMLElement;
  }
  
  function heatLayer(
    latlngs: [number, number, number][] | [number, number][],
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      minOpacity?: number;
      gradient?: { [key: number]: string };
    }
  ): Layer;
}

export interface HeatmapLayerProps {
  points: GtaCoordinates[];
  settings: HeatmapSettings;
}

export function HeatmapLayer({ points, settings }: HeatmapLayerProps) {
  const map = useMap();
  const heatmapLayerRef = useRef<any>(null);
  const lastPointsRef = useRef<string>('');

  // Memoize heatmap settings to prevent unnecessary recreations
  const heatmapSettings = useMemo(() => ({
    radius: 30, // Fixed radius
    blur: 30, // Fixed blur
    maxZoom: 18, // High value to prevent radius scaling with zoom
    minOpacity: 0.6, // Fixed opacity
    max: 1.0, // Maximum heat value
    gradient: {
      0.2: 'blue',
      0.4: 'cyan',
      0.6: 'lime',
      0.8: 'yellow',
      1.0: 'red'
    }
  }), []);

  // Memoize heat points conversion to prevent unnecessary recalculations
  const heatPoints = useMemo(() => {
    if (!points || points.length === 0) return [];

    return points
      .filter((point) => {
        // Filter out invalid coordinates
        return (
          point &&
          point.x !== undefined &&
          point.y !== undefined &&
          typeof point.x === 'number' &&
          typeof point.y === 'number' &&
          !isNaN(point.x) &&
          !isNaN(point.y) &&
          isFinite(point.x) &&
          isFinite(point.y)
        );
      })
      .map((point) => {
        try {
          const [lat, lng] = gtaToLeaflet(point.x, point.y);
          
          // Validate the converted coordinates
          if (!isFinite(lat) || !isFinite(lng)) {
            return null;
          }
          
          // Simplified intensity calculation for better performance
          const intensity = 0.8; // Fixed intensity for better performance
          return [lat, lng, intensity] as [number, number, number];
        } catch (error) {
          return null;
        }
      })
      .filter((point): point is [number, number, number] => point !== null);
  }, [points]);

  // Create a stable hash of points to prevent unnecessary updates
  const pointsHash = useMemo(() => {
    return JSON.stringify(heatPoints.map((p: [number, number, number]) => [p[0].toFixed(2), p[1].toFixed(2)]));
  }, [heatPoints]);

  useEffect(() => {
    // Remove heatmap if disabled or no points
    if (!settings || !settings.enabled || heatPoints.length === 0) {
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
      return;
    }

    // Only update if points actually changed
    if (pointsHash === lastPointsRef.current && heatmapLayerRef.current) {
      return;
    }

    // Remove existing heatmap layer
    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
    }

    // Create new heatmap layer
    heatmapLayerRef.current = L.heatLayer(heatPoints, heatmapSettings);
    heatmapLayerRef.current.addTo(map);
    
    // Update last points reference
    lastPointsRef.current = pointsHash;

    // Cleanup function
    return () => {
      if (heatmapLayerRef.current) {
        map.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
    };
  }, [map, heatPoints, pointsHash, settings?.enabled, heatmapSettings]);

  return null; // This component doesn't render anything directly
}

 