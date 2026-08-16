"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Search, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface PlayerLookupSearchProps {
  serverId: string;
  onPlayerSelect: (player: any) => void;
}

export function PlayerLookupSearch({
  serverId,
  onPlayerSelect,
}: PlayerLookupSearchProps) {
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const t = useScopedI18n("lookup");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search for players
  const { data: players, isLoading: playersLoading } = useQuery(
    trpc.servers.searchPlayersLookup.queryOptions(
      {
        serverId,
        search,
        limit: 10,
      },
      {
        enabled: search.length > 2,
      }
    )
  );

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const handlePlayerSelect = (player: any) => {
    onPlayerSelect(player);
    setSearch("");
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearch("");
    setShowResults(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          {t("search_players")}
        </CardTitle>
        <CardDescription>{t("search_players_description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("search_placeholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value.length > 2) {
                  setShowResults(true);
                } else {
                  setShowResults(false);
                }
              }}
              onFocus={() => {
                if (search.length > 2) {
                  setShowResults(true);
                }
              }}
              className="pl-10 pr-10"
            />
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {showResults && search.length > 2 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-96 overflow-y-auto">
              <Command>
                <CommandList>
                  {playersLoading && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        {t("searching_players")}
                      </span>
                    </div>
                  )}
                  {!playersLoading && search.length > 2 && (
                    <>
                      <CommandEmpty>
                        <div className="flex flex-col items-center justify-center p-4">
                          <User className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {t("no_players_found", { search })}
                          </p>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {players?.map((player: any) => {
                          const matchingIdentifiers =
                            player.matchingIdentifiers || [];

                          return (
                            <CommandItem
                              key={player.id}
                              value={player.playerName}
                              onSelect={() => handlePlayerSelect(player)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {player.playerName}
                                  </div>
                                  <div className="text-sm text-muted-foreground truncate">
                                    {player.playerLicense}
                                  </div>
                                  {matchingIdentifiers.length > 0 && (
                                    <div className="text-xs text-violet-600 truncate">
                                      {t("matches")}:{" "}
                                      {matchingIdentifiers
                                        .slice(0, 2)
                                        .join(", ")}
                                      {player.totalMatchingIdentifiers > 2 &&
                                        ` +${
                                          player.totalMatchingIdentifiers - 2
                                        } more`}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right text-sm">
                                  <div>
                                    {t("played")}{" "}
                                    {formatPlayTime(player.playTime)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {t("last_seen")}{" "}
                                    {format(
                                      new Date(player.lastJoin),
                                      "MMM dd"
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </div>
          )}
        </div>

        {search.length > 0 && search.length <= 2 && (
          <p className="text-sm text-muted-foreground mt-2">
            {t("type_characters")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
