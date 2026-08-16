"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScopedI18n } from "@/locales/client";
import { PlayerStatus } from "@vexonac/types";
import { ChevronDown, ChevronUp, Users, X } from "lucide-react";
import { useState } from "react";
import { type MapMarker, type PlayerMarker } from "./map-types";

interface PlayerListProps {
  players: MapMarker[];
  onPlayerClick: (player: MapMarker) => void;
  totalPlayerCount: number;
  isMobile?: boolean;
}

export function PlayerList({
  players,
  onPlayerClick,
  totalPlayerCount,
  isMobile = false,
}: PlayerListProps) {
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const t = useScopedI18n("interactive_map");

  // Mobile design: collapsed = icon only, expanded = full width overlay
  if (isMobile) {
    if (!isExpanded) {
      // Collapsed mobile state - just floating icons
      return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          {/* Player count button */}
          <Button
            onClick={() => setIsExpanded(true)}
            className="w-12 h-12 rounded-full bg-black/90 border-white/20 backdrop-blur-md hover:bg-black/80 p-0"
          >
            <div className="flex flex-col items-center">
              <Users className="h-4 w-4 text-white" />
              <span className="text-xs text-white font-bold">
                {players.length}
              </span>
            </div>
          </Button>
        </div>
      );
    }

    // Expanded mobile state - full width overlay
    return (
      <div className="absolute inset-0 z-[1250] bg-black/50 backdrop-blur-sm">
        <div className="absolute inset-x-4 top-4 bottom-4">
          <Card className="bg-black/95 border-white/20 backdrop-blur-md shadow-2xl h-full flex flex-col">
            {/* Header */}
            <CardHeader className="p-4 pb-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-white" />
                  <CardTitle className="text-white text-lg font-medium">
                    {t("players")}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {players.length}/{totalPlayerCount}
                  </Badge>
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

            {/* Content */}
            <CardContent className="p-4 pt-2 flex-1 min-h-0">
              {players.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t("no_players_found")}</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {players.map((player) => {
                      const playerData = player as PlayerMarker;
                      return (
                        <Button
                          key={player.id}
                          variant="ghost"
                          onClick={() => {
                            onPlayerClick(player);
                            setIsExpanded(false); // Close overlay after selection
                          }}
                          className="w-full h-auto p-3 hover:bg-white/10 transition-colors text-left flex items-center justify-between"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <Badge
                              variant="outline"
                              className="text-sm bg-white/10 text-white/80 border-white/20 flex-shrink-0"
                            >
                              #{playerData.id}
                            </Badge>
                            <div className="flex flex-col items-start flex-1 min-w-0">
                              <span className="text-white font-medium text-left truncate w-full">
                                {playerData.name}
                              </span>
                              <div className="flex gap-2 text-xs">
                                {playerData.admin && (
                                  <span className="text-orange-400">Admin</span>
                                )}
                                {playerData.status ===
                                  PlayerStatus.IN_VEHICLE && (
                                  <span className="text-purple-400">
                                    {t("in_vehicle")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronDown className="h-4 w-4 text-white/60 rotate-[-90deg]" />
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Desktop design (unchanged)
  return (
    <div className="absolute top-4 right-4 z-[1000] w-80">
      <Card className="bg-black/90 border-white/20 backdrop-blur-md shadow-2xl gap-0">
        {/* Header with toggle */}
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-white flex-shrink-0" />
              <CardTitle className="text-white text-sm font-medium">
                {t("players")}
              </CardTitle>
              <Badge
                variant="secondary"
                className="text-xs bg-white/20 text-white"
              >
                {players.length}/{totalPlayerCount}
              </Badge>
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
          <CardContent className="pt-0 pb-3">
            {players.length === 0 ? (
              <div className="text-center py-3 text-white/60 mt-4">
                <Users className="h-5 w-5 mx-auto mb-1 opacity-50" />
                <p className="text-xs">{t("no_players_found")}</p>
              </div>
            ) : (
              <div className="mt-4">
                <ScrollArea className="h-[40vh] w-full">
                  <div className="space-y-2 pr-4">
                    {players.map((player) => {
                      const playerData = player as PlayerMarker;
                      return (
                        <Button
                          key={player.id}
                          variant="ghost"
                          onClick={() => onPlayerClick(player)}
                          className="w-full h-auto hover:bg-white/10 transition-colors text-left flex items-center justify-start p-2 gap-2"
                        >
                          <Badge
                            variant="outline"
                            className="text-xs bg-white/10 text-white/80 border-white/20 flex-shrink-0"
                          >
                            #{playerData.id}
                          </Badge>
                          <span className="text-white text-sm font-medium truncate text-left flex-1">
                            {playerData.name}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

