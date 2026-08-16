"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useScopedI18n } from "@/locales/client";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Filter,
  Settings,
  ThermometerSun,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { type GtaCoordinates, MAP_STYLES, type MapSettings } from "./map-types";



export type PlayerFilterType =
  | "none"
  | "recently-connected"
  | "low-playtime"
  | "admins"
  | "potential-threat";

export interface MapControlsProps {
  settings: MapSettings;
  currentPosition?: GtaCoordinates;
  onSettingsChange: (settings: Partial<MapSettings>) => void;
  onPlayerFilter: (filter: string) => void;
  onPlayerFilterTypeChange: (filterType: PlayerFilterType) => void;
  playerCount: number;
  filteredCount: number;
  playerFilterType: PlayerFilterType;
  isMobile?: boolean;
}

export function MapControls({
  settings,
  currentPosition,
  onSettingsChange,
  onPlayerFilter,
  onPlayerFilterTypeChange,
  playerCount = 0,
  filteredCount = 0,
  playerFilterType = "none",
  isMobile = false,
}: MapControlsProps) {
  const t = useScopedI18n("interactive_map");
  const [isExpanded, setIsExpanded] = useState(!isMobile); // Collapsed by default on mobile
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [filterText, setFilterText] = useState("");

  // Memoize map styles to prevent infinite re-renders
  const mapStyleOptions = useMemo(() => Object.values(MAP_STYLES), []);

  const handleCopyCoordinates = (coords: GtaCoordinates) => {
    const coordText = `${coords.x.toFixed(2)}, ${coords.y.toFixed(2)}`;
    navigator.clipboard.writeText(coordText);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleFilterChange = (value: string) => {
    setFilterText(value);
    onPlayerFilter?.(value);
  };

  const clearFilter = () => {
    setFilterText("");
    onPlayerFilter?.("");
  };

  const handleFilterTypeChange = (filterType: PlayerFilterType) => {
    // If the same filter is clicked, toggle it off
    const newFilterType = playerFilterType === filterType ? "none" : filterType;
    onPlayerFilterTypeChange?.(newFilterType);
  };

  // Mobile compact design
  if (isMobile) {
    return (
      <div className="absolute top-4 left-4 z-[1100]">
        {" "}
        {/* Higher z-index than player list */}
        {!isExpanded ? (
          // Collapsed mobile state - just settings icon
          <Button
            onClick={() => setIsExpanded(true)}
            className="w-12 h-12 rounded-full bg-black/90 border-white/20 backdrop-blur-md hover:bg-black/80 p-0"
          >
            <Settings className="h-5 w-5 text-white" />
          </Button>
        ) : (
          // Expanded mobile state - full screen overlay with proper positioning
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1200]">
            <div className="absolute inset-x-4 top-4 bottom-4">
              <Card className="bg-black/95 border-white/20 backdrop-blur-md shadow-2xl h-full flex flex-col">
                <CardHeader className="p-4 pb-2 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-white" />
                      <CardTitle className="text-white text-lg font-medium">
                        {t("map_controls")}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(false)}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 flex-1 space-y-4">
                  {/* Map Style Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/90">
                      {t("map_style")}
                    </label>
                    <Select
                      value={settings.style}
                      onValueChange={(value) =>
                        onSettingsChange({ style: value })
                      }
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mapStyleOptions.map((style) => (
                          <SelectItem key={style.id} value={style.id}>
                            {style.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Player Filter Switches - mobile optimized */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white/90">
                      {t("player_filters")}
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleFilterTypeChange("recently-connected")
                        }
                        className={`text-sm h-12 border-white/20 transition-colors justify-start px-4 ${
                          playerFilterType === "recently-connected"
                            ? "bg-violet-500 text-white border-violet-500 shadow-lg"
                            : "bg-white/10 text-white hover:bg-violet-500/20"
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            🆕 {t("recently_connected")}
                          </span>
                          <span className="text-xs opacity-80">
                            {t("recently_connected_desc")}
                          </span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFilterTypeChange("low-playtime")}
                        className={`text-sm h-12 border-white/20 transition-colors justify-start px-4 ${
                          playerFilterType === "low-playtime"
                            ? "bg-yellow-500 text-black border-yellow-500 shadow-lg font-medium"
                            : "bg-white/10 text-white hover:bg-yellow-500/20"
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            ⏱️ {t("low_playtime")}
                          </span>
                          <span className="text-xs opacity-80">
                            {t("low_playtime_desc")}
                          </span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleFilterTypeChange("potential-threat")
                        }
                        className={`text-sm h-12 border-white/20 transition-colors justify-start px-4 ${
                          playerFilterType === "potential-threat"
                            ? "bg-red-500 text-white border-red-500 shadow-lg"
                            : "bg-white/10 text-white hover:bg-red-500/20"
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            ⚠️ Potential Threats
                          </span>
                          <span className="text-xs opacity-80">
                            Threat score ≥60
                          </span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFilterTypeChange("admins")}
                        className={`text-sm h-12 border-white/20 transition-colors justify-start px-4 ${
                          playerFilterType === "admins"
                            ? "bg-orange-500 text-white border-orange-500 shadow-lg"
                            : "bg-white/10 text-white hover:bg-orange-500/20"
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            🛡️ {t("show_admins")}
                          </span>
                          <span className="text-xs opacity-80">
                            {t("show_admins_desc")}
                          </span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-[1000] w-80">
      <Card className="bg-black/90 border-white/20 backdrop-blur-md shadow-2xl">
        {/* Header with toggle */}
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-white" />
              <CardTitle className="text-white text-sm font-medium">
                {t("map_controls")}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        {/* Expandable content */}
        {isExpanded && (
          <CardContent className="pt-0 space-y-4">
            {/* Map Style Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/80">
                {t("map_style")}
              </label>
              <Select
                value={settings.style}
                onValueChange={(value) => onSettingsChange({ style: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mapStyleOptions.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Heatmap Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/80 flex items-center gap-1">
                  <ThermometerSun className="h-3 w-3" />
                  Player Heatmap
                </label>
                <Switch
                  checked={settings.heatmap?.enabled || false}
                  onCheckedChange={(enabled) =>
                    onSettingsChange({
                      heatmap: { ...settings.heatmap, enabled }
                    })
                  }
                  className="data-[state=checked]:bg-red-500"
                />
              </div>

            </div>

            <Separator className="bg-white/20" />

            {/* Player Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-white/80 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {t("filter_players")}
                </label>
                {playerCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-white/20 text-white"
                  >
                    {filteredCount}/{playerCount}
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Input
                  placeholder={t("search_placeholder")}
                  value={filterText}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-white/60 pr-8 focus:bg-white/20 transition-colors"
                />
                {filterText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilter}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/20"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Player Filter Switches */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-medium text-white/80">
                  {t("player_filters")}
                </label>

                {/* Recently Connected */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/90">
                      {t("recently_connected")}
                    </span>
                    <span className="text-xs text-white/60">(&lt;1h)</span>
                  </div>
                  <Switch
                    checked={playerFilterType === "recently-connected"}
                    onCheckedChange={() =>
                      handleFilterTypeChange("recently-connected")
                    }
                    className="data-[state=checked]:bg-violet-500"
                  />
                </div>

                {/* Low Play Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/90">
                      {t("low_playtime")}
                    </span>
                    <span className="text-xs text-white/60">(&lt;60m)</span>
                  </div>
                  <Switch
                    checked={playerFilterType === "low-playtime"}
                    onCheckedChange={() =>
                      handleFilterTypeChange("low-playtime")
                    }
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </div>

                {/* Potential Threats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/90">
                      Potential Threats
                    </span>
                    <span className="text-xs text-white/60">(≥60)</span>
                  </div>
                  <Switch
                    checked={playerFilterType === "potential-threat"}
                    onCheckedChange={() =>
                      handleFilterTypeChange("potential-threat")
                    }
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>

                {/* Show Admins */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/90">
                      {t("show_admins")}
                    </span>
                    <span className="text-xs text-white/60">🛡️</span>
                  </div>
                  <Switch
                    checked={playerFilterType === "admins"}
                    onCheckedChange={() => handleFilterTypeChange("admins")}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Marker Position */}
            {currentPosition && (
              <>
                <Separator className="bg-white/20" />
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/80">
                    {t("marker_position")}
                  </label>
                  <div className="flex items-center justify-between bg-white/5 rounded-md p-3 border border-white/10">
                    <div className="font-mono text-sm text-white">
                      <div className="space-y-0.5">
                        <div>
                          X: {currentPosition.x.toFixed(2)}; Y:{" "}
                          {currentPosition.y.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCoordinates(currentPosition)}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      {copiedCoords ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
