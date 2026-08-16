"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getThreatRiskLevelText,
  getThreatScoreBadgeVariant,
  getThreatScoreColor,
} from "@/lib/utils";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Ban,
  Clock,
  Gavel,
  Hash,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatServerName } from "../format-server-name";

interface PlayerLookupResultsProps {
  serverId: string;
  playerId: string;
  playerName: string;
  onClose: () => void;
}

export function PlayerLookupResults({
  serverId,
  playerId,

  onClose,
}: PlayerLookupResultsProps) {
  const [mediaModal, setMediaModal] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banForm, setBanForm] = useState({
    reason: "",
    evidenceUrl: "",
    banType: "permanent" as "permanent" | "temporary",
    duration: 24,
  });
  const t = useScopedI18n("lookup");
  const queryClient = useQueryClient();

  // Fetch player lookup details
  const { data: playerData, isLoading } = useQuery(
    trpc.servers.getPlayerLookupDetails.queryOptions({
      serverId,
      playerId,
    })
  );

  // Ban player mutation
  const banPlayerMutation = useMutation(
    trpc.servers.banPlayer.mutationOptions({
      onSuccess: (data: any) => {
        toast.success(t("ban_success", { playerName: data.playerName }));
        setBanDialogOpen(false);
        setBanForm({
          reason: "",
          evidenceUrl: "",
          banType: "permanent",
          duration: 24,
        });
        // Refresh the player lookup details
        queryClient.invalidateQueries({
          queryKey: ["servers", "getPlayerLookupDetails"],
        });
      },
      onError: (error: any) => {
        toast.error(error.message || t("ban_error"));
      },
    })
  );

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  // Check if player is already banned on current server
  const isPlayerBanned =
    playerData?.playerBans?.some(
      (ban: any) =>
        ban.server.isCurrentServer &&
        (!ban.expiresAt || new Date(ban.expiresAt) > new Date())
    ) || false;

  const renderEvidence = (evidenceUrl: string | null) => {
    if (!evidenceUrl) {
      return (
        <span className="text-xs text-muted-foreground">
          {t("no_evidence")}
        </span>
      );
    }

    // Check if it's an image
    if (evidenceUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
      return (
        <div className="w-16 h-12 rounded border overflow-hidden">
          <img
            src={evidenceUrl}
            alt="Evidence"
            className="w-full h-full object-cover cursor-pointer hover:opacity-80"
            onClick={(e) => {
              e.stopPropagation();
              setMediaModal({ url: evidenceUrl, type: "image" });
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              (
                e.currentTarget.nextElementSibling as HTMLElement
              ).style.display = "block";
            }}
          />
          <div className="hidden text-xs text-muted-foreground">
            <a
              href={evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {t("view_evidence")}
            </a>
          </div>
        </div>
      );
    }

    // Check if it's a video
    if (evidenceUrl.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i)) {
      return (
        <div className="w-16 h-12 rounded border overflow-hidden">
          <video
            src={evidenceUrl}
            className="w-full h-full object-cover cursor-pointer hover:opacity-80"
            preload="metadata"
            playsInline
            muted
            onClick={(e) => {
              e.stopPropagation();
              setMediaModal({ url: evidenceUrl, type: "video" });
            }}
            onError={(e) => {
              (e.currentTarget as HTMLVideoElement).style.display = "none";
              (
                e.currentTarget.nextElementSibling as HTMLElement
              ).style.display = "block";
            }}
          />
          <div className="hidden text-xs text-muted-foreground">
            <a
              href={evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {t("view_video")}
            </a>
          </div>
        </div>
      );
    }

    // For other URLs, show a link
    return (
      <a
        href={evidenceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-violet-600 hover:text-violet-800 underline"
        onClick={(e) => e.stopPropagation()}
      >
        {t("view_evidence")}
      </a>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("loading_player_data")}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!playerData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("player_not_found")}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("unable_to_load")}</p>
        </CardContent>
      </Card>
    );
  }

  const {
    player,
    altAccounts,
    playerBans,
    bansHistory,
    sameServerAltBans,
    crossServerBans,
    threatScore,
  } = playerData;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {player.playerName}
              </CardTitle>
              <CardDescription>
                {t("player_reputation_analysis")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isPlayerBanned && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBanDialogOpen(true)}
                  disabled={banPlayerMutation.isPending}
                >
                  <Gavel className="h-4 w-4 mr-1" />
                  {t("ban_player_action")}
                </Button>
              )}
              {isPlayerBanned && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <Ban className="h-3 w-3" />
                  {t("banned_status")}
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Trust Score Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t("trust_score")}
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold ${getThreatScoreColor(
                    threatScore.score
                  )}`}
                >
                  {threatScore.score}/100
                </span>
                <Badge
                  variant={getThreatScoreBadgeVariant(threatScore.riskLevel)}
                >
                  {threatScore.riskLevel === "LOW" && (
                    <ShieldCheck className="h-3 w-3 mr-1" />
                  )}
                  {threatScore.riskLevel === "MEDIUM" && (
                    <Shield className="h-3 w-3 mr-1" />
                  )}
                  {threatScore.riskLevel === "HIGH" && (
                    <ShieldAlert className="h-3 w-3 mr-1" />
                  )}
                  {threatScore.riskLevel === "CRITICAL" && (
                    <ShieldOff className="h-3 w-3 mr-1" />
                  )}
                  {getThreatRiskLevelText(threatScore.riskLevel, t)}
                </Badge>
              </div>
            </div>

            <div className="mb-4">
              <Progress value={threatScore.score} className="mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("perfect_trust")}</span>
                <span className="text-yellow-600">{t("neutral")}</span>
                <span>{t("maximum_risk")}</span>
              </div>
            </div>
            {/* Warnings */}
            {threatScore.warnings.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {t("warnings")}
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {threatScore.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-destructive">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                {t("play_time_label")}
              </div>
              <div className="font-semibold">
                {formatPlayTime(player.playTime)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                {t("first_join")}
              </div>
              <div className="font-semibold">
                {format(new Date(player.firstJoin), "MMM dd, yyyy")}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                {t("last_join")}
              </div>
              <div className="font-semibold">
                {formatDistanceToNow(new Date(player.lastJoin), {
                  addSuffix: true,
                })}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                {t("license_label")}
              </div>
              <div className="font-semibold font-mono text-xs">
                {player.playerLicense}
              </div>
            </div>
          </div>

          {/* Tabs for detailed information */}
          <Tabs defaultValue="identifiers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="identifiers"
                className="flex items-center gap-2"
              >
                <Hash className="h-4 w-4" />
                {t("identifiers")} (
                {(Array.isArray(player.identifiers)
                  ? player.identifiers.length
                  : 0) +
                  (Array.isArray(player.oldIdentifiers)
                    ? player.oldIdentifiers.length
                    : 0)}
                )
              </TabsTrigger>
              <TabsTrigger
                value="alt-accounts"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                {t("alt_accounts")} ({altAccounts?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="bans" className="flex items-center gap-2">
                <Ban className="h-4 w-4" />
                {t("active_bans_tab")} (
                {(playerBans?.length || 0) +
                  (sameServerAltBans?.length || 0) +
                  (crossServerBans?.length || 0)}
                )
              </TabsTrigger>
            </TabsList>

            <TabsContent value="identifiers" className="space-y-4">
              <div className="space-y-4">
                {/* Current Identifiers */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    {t("current_identifiers")} (
                    {Array.isArray(player.identifiers)
                      ? player.identifiers.filter((identifier: string) =>
                          /^[a-zA-Z]{2,}:.+/.test(identifier) &&
                          !identifier.startsWith("sid:") &&
                          !identifier.startsWith("sid2:")
                        ).length
                      : 0}
                    )
                  </h4>
                  {!Array.isArray(player.identifiers) ||
                  player.identifiers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No current identifiers found
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {player.identifiers
                        .filter((identifier: string) =>
                          /^[a-zA-Z]{2,}:.+/.test(identifier) &&
                          !identifier.startsWith("sid:") &&
                          !identifier.startsWith("sid2:")
                        )
                        .map((identifier: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <code className="text-sm font-mono flex-1">
                              {identifier}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-2"
                              onClick={() => {
                                navigator.clipboard.writeText(identifier);
                                toast.success(t("identifier_copied"));
                              }}
                            >
                              <Hash className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Old Identifiers */}
                {Array.isArray(player.oldIdentifiers) &&
                  player.oldIdentifiers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t("previous_identifiers")} (
                        {
                          player.oldIdentifiers.filter((identifier: string) =>
                            /^[a-zA-Z]{2,}:.+/.test(identifier) &&
                            !identifier.startsWith("sid:") &&
                            !identifier.startsWith("sid2:")
                          ).length
                        }
                        )
                      </h4>
                      <div className="space-y-1">
                        {player.oldIdentifiers
                          .filter((identifier: string) =>
                            /^[a-zA-Z]{2,}:.+/.test(identifier) &&
                            !identifier.startsWith("sid:") &&
                            !identifier.startsWith("sid2:")
                          )
                          .map((identifier: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 border rounded opacity-75"
                            >
                              <code className="text-sm font-mono flex-1">
                                {identifier}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 ml-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(identifier);
                                  toast.success(t("identifier_copied"));
                                }}
                              >
                                <Hash className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Summary */}
                <div className="p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg">
                  <h5 className="font-medium text-violet-900 dark:text-violet-100 mb-2">
                    {t("identifier_summary")}
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-violet-700 dark:text-violet-300">
                        {t("total_identifiers")}:
                      </span>
                      <span className="ml-2 font-medium">
                        {(Array.isArray(player.identifiers)
                          ? player.identifiers.length
                          : 0) +
                          (Array.isArray(player.oldIdentifiers)
                            ? player.oldIdentifiers.length
                            : 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-violet-700 dark:text-violet-300">
                        {t("identifier_changes")}:
                      </span>
                      <span className="ml-2 font-medium">
                        {Array.isArray(player.oldIdentifiers)
                          ? player.oldIdentifiers.length
                          : 0}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-violet-600 dark:text-violet-400 mt-2">
                    {t("frequent_changes_warning")}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="alt-accounts" className="space-y-4">
              {!altAccounts || altAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {t("no_alt_accounts")}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("player_name_label")}</TableHead>
                        <TableHead>{t("server")}</TableHead>
                        <TableHead>{t("play_time_label")}</TableHead>
                        <TableHead>{t("last_join")}</TableHead>
                        <TableHead>{t("matching_ids")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {altAccounts.map((alt: any) => (
                        <TableRow key={alt.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {alt.playerName}
                              </div>
                              <div className="text-sm text-muted-foreground font-mono">
                                {alt.playerLicense}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {formatServerName(alt.server?.name) ||
                                  "Unknown Server"}
                              </div>
                              {alt.server?.isCurrentServer && (
                                <Badge variant="outline" className="text-xs">
                                  {t("current_server")}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatPlayTime(alt.playTime || 0)}
                          </TableCell>
                          <TableCell>
                            {alt.lastJoin
                              ? formatDistanceToNow(new Date(alt.lastJoin), {
                                  addSuffix: true,
                                })
                              : "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {alt.identifiersCount || 0} {t("identifier")}
                              {(alt.identifiersCount || 0) !== 1 ? "s" : ""}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="bans" className="space-y-4">
              {(!playerBans || playerBans.length === 0) &&
              (!sameServerAltBans || sameServerAltBans.length === 0) &&
              (!crossServerBans || crossServerBans.length === 0) ? (
                <div className="text-center py-8">
                  <ShieldCheck className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t("no_bans_found")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Player Bans */}
                  {((playerBans && playerBans.length > 0) ||
                    (sameServerAltBans && sameServerAltBans.length > 0)) && (
                    <div>
                      <h4 className="font-medium mb-2">{t("server_bans")}</h4>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("server")}</TableHead>
                              <TableHead>{t("player_column")}</TableHead>
                              <TableHead>{t("play_time_label")}</TableHead>
                              <TableHead>{t("reason")}</TableHead>
                              <TableHead>{t("evidence")}</TableHead>
                              <TableHead>{t("matching_ids")}</TableHead>
                              <TableHead>{t("date")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Direct bans */}
                            {playerBans &&
                              playerBans.map((ban: any) => (
                                <TableRow key={ban.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">
                                        {formatServerName(ban.server?.name) ||
                                          "Unknown Server"}
                                      </div>
                                      {ban.server?.isCurrentServer && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {t("current_server")}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">
                                      {player.playerName}
                                    </div>
                                    <Badge
                                      variant="default"
                                      className="text-xs"
                                    >
                                      {t("direct_ban")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {formatPlayTime(player.playTime || 0)}
                                  </TableCell>
                                  <TableCell>
                                    <div
                                      className="max-w-[200px] truncate"
                                      title={ban.reason}
                                    >
                                      {ban.reason || t("no_reason_provided")}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {renderEvidence(ban.evidenceUrl)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="default">
                                      {t("direct_ban")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {ban.bannedAt
                                        ? format(
                                            new Date(ban.bannedAt),
                                            "MMM dd, yyyy"
                                          )
                                        : "Unknown"}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}

                            {/* Alt account bans on same server */}
                            {sameServerAltBans &&
                              sameServerAltBans.map((ban: any) => (
                                <TableRow key={`alt-${ban.id}`}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">
                                        {formatServerName(ban.server?.name) ||
                                          "Unknown Server"}
                                      </div>
                                      {ban.server?.isCurrentServer && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {t("current_server")}
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">
                                      {ban.player?.playerName || "Unknown"}
                                    </div>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {t("alt_account")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {formatPlayTime(ban.player?.playTime || 0)}
                                  </TableCell>
                                  <TableCell>
                                    <div
                                      className="max-w-[200px] truncate"
                                      title={ban.reason}
                                    >
                                      {ban.reason || t("no_reason_provided")}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {renderEvidence(ban.evidenceUrl)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">
                                      {ban.matchingIdentifiersCount || 0}{" "}
                                      {t("identifier")}
                                      {(ban.matchingIdentifiersCount || 0) !== 1
                                        ? "s"
                                        : ""}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      {ban.bannedAt
                                        ? format(
                                            new Date(ban.bannedAt),
                                            "MMM dd, yyyy"
                                          )
                                        : "Unknown"}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Cross-Server Bans */}
                  {crossServerBans && crossServerBans.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">
                        {t("cross_server_bans_section")}
                      </h4>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("server")}</TableHead>
                              <TableHead>{t("player_column")}</TableHead>
                              <TableHead>{t("play_time_label")}</TableHead>
                              <TableHead>{t("reason")}</TableHead>
                              <TableHead>{t("evidence")}</TableHead>
                              <TableHead>{t("matching_ids")}</TableHead>
                              <TableHead>{t("date")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {crossServerBans.map((ban: any) => (
                              <TableRow key={ban.id}>
                                <TableCell>
                                  <div className="font-medium">
                                    {formatServerName(ban.server?.name) ||
                                      "Unknown Server"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {ban.player?.playerName || "Unknown"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {formatPlayTime(ban.player?.playTime || 0)}
                                </TableCell>
                                <TableCell>
                                  <div
                                    className="max-w-[200px] truncate"
                                    title={ban.reason}
                                  >
                                    {ban.reason || t("no_reason_provided")}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {renderEvidence(ban.evidenceUrl)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {ban.matchingIdentifiersCount || 0}{" "}
                                    {t("identifier")}
                                    {(ban.matchingIdentifiersCount || 0) !== 1
                                      ? "s"
                                      : ""}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {ban.bannedAt
                                      ? format(
                                          new Date(ban.bannedAt),
                                          "MMM dd, yyyy"
                                        )
                                      : "Unknown"}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("ban_player_action")}</DialogTitle>
            <DialogDescription>
              {t("ban_player_description", { playerName: player.playerName })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">{t("ban_reason_dialog")}</Label>
              <Textarea
                id="reason"
                placeholder={t("ban_reason_placeholder_dialog")}
                value={banForm.reason}
                onChange={(e) =>
                  setBanForm({ ...banForm, reason: e.target.value })
                }
                className="min-h-[80px]"
              />
              <div className="text-xs text-muted-foreground">
                {banForm.reason.length}/500 {t("ban_reason_description_dialog")}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidenceUrl">{t("evidence_url_dialog")}</Label>
              <Input
                id="evidenceUrl"
                type="url"
                placeholder={t("evidence_url_placeholder_dialog")}
                value={banForm.evidenceUrl}
                onChange={(e) =>
                  setBanForm({ ...banForm, evidenceUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banType">{t("ban_type_dialog")}</Label>
              <Select
                value={banForm.banType}
                onValueChange={(value: "permanent" | "temporary") =>
                  setBanForm({ ...banForm, banType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">
                    {t("permanent_ban_dialog")}
                  </SelectItem>
                  <SelectItem value="temporary">
                    {t("temporary_ban_dialog")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {banForm.banType === "temporary" && (
              <div className="space-y-2">
                <Label htmlFor="duration">{t("duration_hours")}</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="8760"
                  value={banForm.duration}
                  onChange={(e) =>
                    setBanForm({
                      ...banForm,
                      duration: parseInt(e.target.value) || 24,
                    })
                  }
                />
                <div className="text-xs text-muted-foreground">
                  {t("duration_max")}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              disabled={banPlayerMutation.isPending}
            >
              {t("cancel_dialog")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                banPlayerMutation.mutate({
                  serverId,
                  playerIdentifier: player.playerLicense,
                  reason: banForm.reason,
                  evidenceUrl: banForm.evidenceUrl || undefined,
                  expiresAt:
                    banForm.banType === "temporary"
                      ? new Date(
                          Date.now() + banForm.duration * 60 * 60 * 1000
                        ).toISOString()
                      : undefined,
                });
              }}
              disabled={banPlayerMutation.isPending || !banForm.reason}
            >
              {banPlayerMutation.isPending
                ? t("banning")
                : t("ban_player_action")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Modal */}
      <Dialog open={!!mediaModal} onOpenChange={() => setMediaModal(null)}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{t("evidence_modal")}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto">
            {mediaModal?.type === "image" && (
              <img
                src={mediaModal.url}
                alt="Evidence"
                className="w-full h-auto"
              />
            )}
            {mediaModal?.type === "video" && (
              <video 
                src={mediaModal.url} 
                controls 
                autoPlay
                muted
                playsInline
                preload="metadata"
                className="w-full h-auto" 
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMediaModal(null)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
