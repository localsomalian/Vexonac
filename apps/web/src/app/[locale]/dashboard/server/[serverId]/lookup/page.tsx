"use client";

import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import { PlayerLookupResults } from "@/components/lookup/player-lookup-results";
import { PlayerLookupSearch } from "@/components/lookup/player-lookup-search";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { hasPermission } from "@/lib/utils";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import type { Permission } from "@vexonac/database";
import { ShieldAlert, Users } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ServerLookup() {
  const params = useParams();
  const searchParams = useSearchParams();
  const serverId = params.serverId as string;
  const licenseParam = searchParams.get("license");
  const { data: session } = useSession();
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [hasAutoQueried, setHasAutoQueried] = useState(false);
  const t = useScopedI18n("lookup");

  const { data: server, isLoading: serverLoading } = useQuery(
    trpc.servers.getServer.queryOptions(serverId, {
      enabled: !!session?.user,
      staleTime: 300000,
    })
  );

  // Auto-search when license parameter is present
  const { data: autoSearchPlayers, isLoading: autoSearchLoading } = useQuery(
    trpc.servers.searchPlayersLookup.queryOptions(
      {
        serverId,
        search: licenseParam || "",
        limit: 10,
      },
      {
        enabled: !!licenseParam && !hasAutoQueried && !!session?.user,
      }
    )
  );

  // Auto-select player when search results come back
  useEffect(() => {
    if (licenseParam && autoSearchPlayers && !hasAutoQueried) {
      setHasAutoQueried(true);

      if (autoSearchPlayers.length === 1) {
        // Auto-select if there's exactly one match
        setSelectedPlayer(autoSearchPlayers[0]);
      } else if (autoSearchPlayers.length > 1) {
        // If multiple matches, try to find exact license match
        const exactMatch = autoSearchPlayers.find(
          (player: any) => player.playerLicense === licenseParam
        );
        if (exactMatch) {
          setSelectedPlayer(exactMatch);
        }
      }
    }
  }, [licenseParam, autoSearchPlayers, hasAutoQueried]);

  // Check basic server membership first
  const isServerMember = useMemo(() => {
    if (!server) return false;
    if (server.isOwner) return true;
    if (server.permissions && Array.isArray(server.permissions)) {
      const permissions = server.permissions.map((p) =>
        String(p)
      ) as Permission[];
      return hasPermission(permissions, "ANY");
    }
    return false;
  }, [server]);

  // Check permissions
  const isOwner = server?.isOwner;
  const hasPlayersLookupPermission = hasPermission(
    server?.permissions,
    "PLAYERS_LOOKUP"
  );
  const isAllowed = isOwner || hasPlayersLookupPermission;

  if (serverLoading || (licenseParam && autoSearchLoading && !hasAutoQueried)) {
    return (
      <ContentLayout
        title={t("loading")}
        breadcrumb={{
          title: "Dashboard",
          url: `/dashboard/server/${serverId}`,
        }}
      >
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ContentLayout>
    );
  }

  if (!isServerMember) {
    return (
      <ContentLayout
        title={formatServerName(server?.serverName || t("lookup_dashboard"))}
        breadcrumb={{
          title: "Dashboard",
          url: `/dashboard/server/${serverId}`,
        }}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive/60 mb-4" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            You don't have permission to access this server. Contact the server
            owner to get added as a server member.
          </p>
        </div>
      </ContentLayout>
    );
  }

  if (!isAllowed) {
    return (
      <ContentLayout
        title={formatServerName(server?.serverName || t("lookup_dashboard"))}
        breadcrumb={{
          title: "Dashboard",
          url: `/dashboard/server/${serverId}`,
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              {t("access_denied")}
            </CardTitle>
            <CardDescription>{t("access_denied_description")}</CardDescription>
          </CardHeader>
        </Card>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      title={formatServerName(server?.serverName || t("lookup_dashboard"))}
      breadcrumb={{
        title: "Dashboard",
        url: `/dashboard/server/${serverId}`,
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {t("player_lookup")}
            </h1>
            <p className="text-muted-foreground">
              {t("search_analyze_description")}
            </p>
          </div>
        </div>

        {/* Search Section */}
        <PlayerLookupSearch
          serverId={serverId}
          onPlayerSelect={setSelectedPlayer}
        />

        {/* Results Section */}
        {selectedPlayer && (
          <PlayerLookupResults
            serverId={serverId}
            playerId={selectedPlayer.id}
            playerName={selectedPlayer.playerName}
            onClose={() => setSelectedPlayer(null)}
          />
        )}

        {/* Help Section */}
        {!selectedPlayer && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("how_to_use")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">
                    {t("search_players_help")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("search_players_help_description")}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {t("trust_score_help")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("trust_score_help_description")}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {t("alt_accounts_help")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("alt_accounts_help_description")}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {t("ban_history_help")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("ban_history_help_description")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ContentLayout>
  );
}

