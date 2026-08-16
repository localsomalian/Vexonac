"use client";

import { BanDetailsDialog } from "@/components/bans/ban-details-dialog";
import { BanPlayerDialog } from "@/components/bans/ban-player-dialog";
import { BansTable } from "@/components/bans/bans-table";
import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { hasPermission } from "@/lib/utils";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Permission } from "@vexonac/database";
import { Ban, Download, Search, ShieldAlert, UserX } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type SortBy = "bannedAt" | "expiresAt" | "playTime";
type SortOrder = "asc" | "desc";

export default function ServerBans() {
  const t = useScopedI18n("bans_page");
  const params = useParams();
  const serverId = params.serverId as string;
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // State for filters and pagination
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("bannedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [selectedBan, setSelectedBan] = useState<any>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanAllDialog, setShowUnbanAllDialog] = useState(false);
  const [isUnbanningAll, setIsUnbanningAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch server data
  const { data: server, isLoading: serverLoading } = useQuery(
    trpc.servers.getServer.queryOptions(serverId, {
      enabled: !!session?.user,
      staleTime: 30000,
    })
  );

  // Fetch bans data
  const {
    data: bansData,
    isLoading: bansLoading,
    refetch: refetchBans,
  } = useQuery(
    trpc.servers.getBans.queryOptions(
      {
        serverId,
        page,
        limit: 20,
        search: search || undefined,
        sortBy,
        sortOrder,
      },
      {
        enabled: !!session?.user && !!server,
        staleTime: 10000,
      }
    )
  );

  // Check basic server membership first
  const isAllowed = useMemo(() => {
    if (!server) return false;
    if (server.isOwner) return true;
    if (server.permissions && Array.isArray(server.permissions)) {
      const permissions = server.permissions.map((p) =>
        String(p)
      ) as Permission[];
      return hasPermission(permissions, "ANY");
    }
    return false;
  }, [server, serverId]);

  // Check permissions
  const isOwner = server?.isOwner;
  const hasManageBansPermission = hasPermission(
    server?.permissions,
    "MANAGE_BANS"
  );
  const hasUnbanAllPermission = hasPermission(server?.permissions, "UNBAN_ALL");
  const canManageBans = isOwner || hasManageBansPermission;
  const canUnbanAll = isOwner || hasUnbanAllPermission;

  // Create the unban all mutation
  const unbanAllMutation = useMutation(
    trpc.servers.unbanAll.mutationOptions({
      onSuccess: () => {
        // Invalidate and refetch the bans data
        queryClient.invalidateQueries({ queryKey: ["servers", "getBans"] });
        refetchBans();
        setShowUnbanAllDialog(false);
        toast.success("All players have been unbanned successfully");
      },
      onError: (error: any) => {
        console.error("Failed to unban all players:", error);
        toast.error("Failed to unban all players. Please try again.");
      },
      onSettled: () => {
        setIsUnbanningAll(false);
      },
    })
  );

  if (serverLoading) {
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

  if (!isAllowed) {
    return (
      <ContentLayout
        title={formatServerName(server?.serverName || "Bans Dashboard")}
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

  if (!canManageBans) {
    return (
      <ContentLayout
        title={formatServerName(server?.serverName || "Bans Dashboard")}
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

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-") as [SortBy, SortOrder];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const handleUnbanAll = async () => {
    setIsUnbanningAll(true);
    unbanAllMutation.mutate({ serverId });
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await trpc.servers.exportBans.query({ serverId });
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.serverName.replace(/[^a-z0-9]/gi, "_")}_bans.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${result.count} bans to CSV`);
    } catch (err) {
      toast.error("Failed to export bans");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ContentLayout
      title={formatServerName(server?.serverName || "Bans Dashboard")}
      breadcrumb={{ title: "Dashboard", url: `/dashboard/server/${serverId}` }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {t("ban_management")}
            </h1>
            <p className="text-muted-foreground">
              {t("manage_player_bans_description")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleExportCSV} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
            {canUnbanAll && (
              <Button
                variant="destructive"
                onClick={() => setShowUnbanAllDialog(true)}
                disabled={isUnbanningAll}
              >
                <UserX className="h-4 w-4 mr-2" />
                {isUnbanningAll ? t("unbanning_all") : t("unban_all")}
              </Button>
            )}
            <Button onClick={() => setShowBanDialog(true)}>
              <Ban className="h-4 w-4 mr-2" />
              {t("ban_offline")}
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>{t("filters_search")}</CardTitle>
            <CardDescription>{t("filters_search_description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("search_placeholder")}
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bannedAt-desc">
                    {t("newest_first")}
                  </SelectItem>
                  <SelectItem value="bannedAt-asc">
                    {t("oldest_first")}
                  </SelectItem>
                  <SelectItem value="expiresAt-desc">
                    {t("expires_latest")}
                  </SelectItem>
                  <SelectItem value="expiresAt-asc">
                    {t("expires_soonest")}
                  </SelectItem>
                  <SelectItem value="playTime-desc">
                    {t("most_playtime")}
                  </SelectItem>
                  <SelectItem value="playTime-asc">
                    {t("least_playtime")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bans Table */}
        <BansTable
          bans={(bansData?.bans as any[]) || []}
          pagination={bansData?.pagination}
          loading={bansLoading}
          onPageChange={setPage}
          onBanClick={setSelectedBan}
          onRefetch={refetchBans}
          serverId={serverId}
        />

        {/* Dialogs */}
        {selectedBan && (
          <BanDetailsDialog
            ban={selectedBan}
            open={!!selectedBan}
            onOpenChange={(open: boolean) => !open && setSelectedBan(null)}
            onUnban={() => {
              refetchBans();
              setSelectedBan(null);
            }}
            serverId={serverId}
          />
        )}

        <BanPlayerDialog
          open={showBanDialog}
          onOpenChange={setShowBanDialog}
          onBanSuccess={() => {
            refetchBans();
            setShowBanDialog(false);
          }}
          serverId={serverId}
        />

        {/* Unban All Confirmation Dialog */}
        <AlertDialog
          open={showUnbanAllDialog}
          onOpenChange={setShowUnbanAllDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("confirm_unban_all")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("confirm_unban_all_description")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnbanAll}
                disabled={isUnbanningAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isUnbanningAll ? t("unbanning_all") : t("unban_all")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ContentLayout>
  );
}

