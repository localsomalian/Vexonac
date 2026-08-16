"use client";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Hash,
  Search,
  Shield,
  ShieldAlert,
  Swords,
  Trash2,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ModelHoverCard } from "../model-hover-card";
import { formatServerName } from "../format-server-name";

interface BanDetailsDialogProps {
  ban: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnban: () => void;
  serverId: string;
}

export function BanDetailsDialog({
  ban,
  open,
  onOpenChange,
  onUnban,
  serverId,
}: BanDetailsDialogProps) {
  const t = useScopedI18n("bans_page");
  const router = useRouter();

  const [mediaModal, setMediaModal] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  const [detectionsTabOpen, setDetectionsTabOpen] = useState(false);

  const unbanMutation = useMutation(
    trpc.servers.unbanPlayer.mutationOptions({
      onSuccess: (data: any) => {
        toast.success(t("unban_success", { playerName: data.playerName }));
        onUnban();
      },
      onError: (error: any) => {
        toast.error(error.message || t("unban_error"));
      },
    })
  );

  const globalBanMutation = useMutation(
    trpc.globalBans.submit.mutationOptions({
      onSuccess: (data: any) => {
        if (data.success) {
          toast.success("Submitted for global ban review — pending admin approval.");
        } else {
          toast.error(data.error || "Failed to submit global ban");
        }
      },
      onError: () => toast.error("Failed to submit global ban"),
    })
  );

  // Fetch detection history for this player
  const { data: playerDetections, isLoading: detectionsLoading } = useQuery(
    trpc.servers.getPlayerDetections.queryOptions(
      {
        serverId,
        playerLicense: ban.player?.identifiers?.find((id: any) => id.type === "LICENSE" || id.type === "license")?.value || ban.identifiers?.find((id: any) => id.type === "LICENSE" || id.type === "license")?.value || "",
        limit: 50,
      } as any,
      { enabled: !!open && detectionsTabOpen }
    )
  );

  const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    CRITICAL: { label: "Critical", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
    HIGH:     { label: "High",     color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" },
    MEDIUM:   { label: "Medium",   color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30" },
    LOW:      { label: "Low",      color: "text-blue-400",   bg: "bg-blue-500/15",   border: "border-blue-500/30" },
  };

  const CODE_LABELS: Record<string, string> = {
    INVINCIBLE: "Invincibility", GODMODE: "God Mode", NOCLIP: "No-Clip", SPEED_HACK: "Speed Hack",
    SUPER_JUMP: "Super Jump", TELEPORT: "Teleport", EXPLOSION_SPAM: "Explosion Spam",
    BLACKLIST_WEP: "Blacklisted Weapon", BLACKLIST_VEH: "Blacklisted Vehicle", ENTITY_SPAM: "Entity Spam",
    INFINITE_AMMO: "Infinite Ammo", RAPID_HEAL: "Rapid Heal", INVISIBLE: "Invisible",
    RESOURCE_INJECT: "Resource Injection", FREEZE_HACK: "Freeze Hack", DAMAGE_MOD: "Damage Modifier",
    MENU_DETECTED: "Cheat Menu", NET_FLOOD: "Network Flood", VEHICLE_SPAWN: "Vehicle Spawn",
    SUPER_DAMAGE: "Super Damage", OBJ_SPAM: "Object Spam", SPECTATOR_ABUSE: "Spectator Abuse",
    AIMBOT: "Aimbot", FREECAM: "Free Camera", HWID_BAN: "HWID Ban", ECONOMY_EXPLOIT: "Economy Exploit",
  };

  // Fetch cross-server ban information
  const { data: crossServerBans } = useQuery(
    trpc.servers.getPlayerCrossBans.queryOptions(
      {
        serverId,
        playerId: ban.player.id,
      },
      {
        enabled: !!ban.player.id && open,
      }
    )
  );

  const handleUnban = () => {
    setShowUnbanDialog(true);
  };

  const confirmUnban = () => {
    unbanMutation.mutate({
      serverId,
      banId: ban.banId,
    });
    setShowUnbanDialog(false);
  };

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const getBanStatus = () => {
    if (!ban.expiresAt) {
      return {
        status: "permanent",
        label: t("permanent"),
        variant: "destructive" as const,
      };
    }

    const expiresAt = new Date(ban.expiresAt);
    const now = new Date();

    if (expiresAt <= now) {
      return {
        status: "expired",
        label: t("expired"),
        variant: "secondary" as const,
      };
    }

    return {
      status: "temporary",
      label: t("expires_in", {
        time: formatDistanceToNow(expiresAt, { addSuffix: true }),
      }),
      variant: "default" as const,
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Function to extract model information from ban details
  const getModelFromBanDetails = () => {
    if (!ban.details || typeof ban.details !== 'object') {
      return null;
    }

    const modelKeys = [
      'pedModel',
      'entityModel', 
      'vehicleModel',
      'objectModel',
      'weapon',
      'weaponHash',
      'weaponType',
      'spoofedWeapon',
      'explosionType',
      'explosionName'
    ];

    for (const key of modelKeys) {
      const value = ban.details[key];
      if (value && typeof (value === 'string' || typeof value === 'number') && value.toString().trim()) {
        return { model: value.toString().trim(), key };
      }
    }

    return null;
  };

  const handleViewInModels = () => {
    const result = getModelFromBanDetails();
    if (result) {
      const searchParams = new URLSearchParams({ search: result.model });
      
      // Check if this is explosion-related based on the actual key that provided the model
      const explosionKeys = ['explosionType', 'explosionName'];
      if (explosionKeys.includes(result.key)) {
        searchParams.set('type', 'explosion');
      }
      
      router.push(`/dashboard/models?${searchParams.toString()}`);
    }
  };

  const renderEvidence = (evidenceUrl: string | null) => {
    if (!evidenceUrl) {
      return (
        <span className="text-sm text-muted-foreground">
          {t("no_evidence")}
        </span>
      );
    }

    // Check if it's an image
    if (evidenceUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
      return (
        <div className="space-y-2">
          <div className="border rounded-md overflow-hidden">
            <img
              src={evidenceUrl}
              alt="Ban evidence"
              className="w-full h-64 object-cover cursor-pointer hover:opacity-80"
              onClick={() => setMediaModal({ url: evidenceUrl, type: "image" })}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
                (
                  e.currentTarget.nextElementSibling as HTMLElement
                ).style.display = "block";
              }}
            />
            <div className="hidden p-2">
              <a
                href={evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-violet-600 hover:text-violet-800 underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                {t("view_evidence")}
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Check if it's a video
    if (evidenceUrl.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i)) {
      return (
        <div className="space-y-2">
          <div className="border rounded-md overflow-hidden">
            <video
              src={evidenceUrl}
              className="w-full h-64 object-cover cursor-pointer hover:opacity-80"
              preload="metadata"
              playsInline
              muted
              controls
              onClick={() => setMediaModal({ url: evidenceUrl, type: "video" })}
              onError={(e) => {
                (e.currentTarget as HTMLVideoElement).style.display = "none";
                (
                  e.currentTarget.nextElementSibling as HTMLElement
                ).style.display = "block";
              }}
            />
            <div className="hidden p-2">
              <a
                href={evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-violet-600 hover:text-violet-800 underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                {t("view_video")}
              </a>
            </div>
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
        className="text-sm text-violet-600 hover:text-violet-800 underline flex items-center gap-1"
      >
        <ExternalLink className="h-3 w-3" />
        {t("view_evidence")}
      </a>
    );
  };

  const banStatus = getBanStatus();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("ban_details")} - #{ban.banId}
            </DialogTitle>
            <DialogDescription>
              {t("ban_details_description")}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="ban-info" className="flex-1" onValueChange={(v) => { if (v === "detection-history") setDetectionsTabOpen(true); }}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ban-info" className="flex items-center gap-1.5 text-xs">
                <Hash className="h-3.5 w-3.5" />
                {t("ban_infos")}
              </TabsTrigger>
              <TabsTrigger value="detection-history" className="flex items-center gap-1.5 text-xs">
                <ShieldAlert className="h-3.5 w-3.5" />
                Detection History
              </TabsTrigger>
              <TabsTrigger value="player-info" className="flex items-center gap-1.5 text-xs">
                <User className="h-3.5 w-3.5" />
                {t("player_infos")}
              </TabsTrigger>
              <TabsTrigger value="identifiers" className="flex items-center gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" />
                {t("identifiers")}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="max-h-[60vh] mt-4">
              {/* Ban Information Tab */}
              <TabsContent value="ban-info" className="space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("ban_id")}
                    </label>
                    <p className="text-sm font-mono">#{ban.banId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("ban_expiration")}
                    </label>
                    <p className="text-sm flex items-center gap-1">
                      {!ban.expiresAt ? (
                        <>
                          <Shield className="h-3 w-3" />
                          {t("permanent")}
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          {format(
                            new Date(ban.expiresAt),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("banned_at")}
                    </label>
                    <p className="text-sm flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(ban.bannedAt), "MMM dd, yyyy HH:mm")}
                    </p>
                  </div>
                  {ban.expiresAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("ban_expiration")}
                      </label>
                      <p className="text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(ban.expiresAt), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                  )}
                  {ban.bannedBy && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Banned By
                        </label>
                        <p className="text-sm font-mono">{ban.bannedBy}</p>
                      </div>
                      <div></div>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("reason")}
                    </label>
                    <p className="text-sm bg-muted p-2 rounded-md">
                      {ban.reason || t("no_reason_provided")}
                    </p>
                  </div>

                  {/* Ban Details right under reason */}
                  {ban.details && Object.keys(ban.details).length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("additional_details")}
                      </label>
                      <div className="bg-muted p-3 rounded-md">
                        {Object.entries(ban.details).map(([key, value]) => {
                          const modelKeys = [
                            'pedModel',
                            'entityModel', 
                            'vehicleModel',
                            'objectModel',
                            'weapon',
                            'weaponHash',
                            'weaponType',
                            'spoofedWeapon',
                            'selectedClientWeapon',
                            'selectedServerWeapon',
                            'explosionType',
                            'explosionName'
                          ];
                          
                          const isModelKey = modelKeys.includes(key);
                          const stringValue = (typeof value === 'string' || typeof value === 'number') ? value.toString() : JSON.stringify(value);
                          
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground min-w-0 flex-shrink-0">
                                {key}:
                              </span>
                              {isModelKey && (typeof value === 'string' || typeof value === 'number') ? (
                                <ModelHoverCard modelName={value.toString().trim()}>
                                  <code className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded cursor-help hover:bg-primary/20 transition-colors">
                                    {stringValue}
                                  </code>
                                </ModelHoverCard>
                              ) : (
                                <code className="text-sm font-mono">
                                  {stringValue}
                                </code>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Model lookup button */}
                      {getModelFromBanDetails() && (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleViewInModels}
                            className="flex items-center gap-2"
                          >
                            <Search className="h-4 w-4" />
                            {t("view_in_models")}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Evidence */}
                {ban.evidenceUrl && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        {t("evidence")}
                      </h3>
                      {renderEvidence(ban.evidenceUrl)}
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Detection History Tab */}
              <TabsContent value="detection-history" className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-orange-400" />
                  <h3 className="text-sm font-semibold">Why They Got Banned</h3>
                  <span className="text-xs text-muted-foreground">— detection chain leading to this ban</span>
                </div>
                {detectionsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-14 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
                    ))}
                  </div>
                ) : playerDetections && playerDetections.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      {playerDetections.length} detection{playerDetections.length !== 1 ? "s" : ""} recorded before ban
                    </p>
                    {playerDetections.map((det: any, idx: number) => {
                      const sev = SEVERITY_CONFIG[det.severity] ?? SEVERITY_CONFIG.LOW;
                      const codeLabel = CODE_LABELS[det.code] ?? det.code;
                      return (
                        <div
                          key={det.id}
                          className={`flex items-center gap-3 rounded-xl border p-3 ${sev.bg} ${sev.border}`}
                        >
                          <span className="text-xs font-bold text-muted-foreground w-6 shrink-0 text-center">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${sev.color}`}>{codeLabel}</p>
                            <p className="text-xs text-muted-foreground font-mono">{det.code}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-semibold text-orange-400">+{det.pts ?? 0} pts</p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(det.createdAt), "MMM d, HH:mm")}
                            </p>
                          </div>
                          {det.screenshotUrl && (
                            <button
                              onClick={() => setMediaModal({ url: det.screenshotUrl, type: "image" })}
                              className="shrink-0 rounded-lg border border-white/[0.06] overflow-hidden hover:opacity-80 transition-opacity"
                              title="View screenshot"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={det.screenshotUrl}
                                alt="Screenshot"
                                className="h-10 w-16 object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-12 text-center">
                    <ShieldAlert className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">No detection history found for this player</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">They may have been manually banned</p>
                  </div>
                )}
              </TabsContent>

              {/* Player Information Tab */}
              <TabsContent value="player-info" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("player_name")}
                    </label>
                    <p className="text-sm font-mono">{ban.player.playerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("play_time")}
                    </label>
                    <p className="text-sm">
                      {formatPlayTime(ban.player.playTime)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("first_join")}
                    </label>
                    <div className="text-sm">
                      <div>
                        {format(
                          new Date(ban.player.firstJoin),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(ban.player.firstJoin), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("last_join")}
                    </label>
                    <div className="text-sm">
                      <div>
                        {format(
                          new Date(ban.player.lastJoin),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(ban.player.lastJoin), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cross-Server Bans */}
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t("banned_on_servers", {
                        count: crossServerBans?.crossServerBans.length || 0,
                      })}
                    </h3>
                    {crossServerBans &&
                      crossServerBans.crossServerBans.length > 0 && (
                        <div className="space-y-3">
                          {crossServerBans.crossServerBans.map(
                            (serverBan: any) => (
                              <div
                                key={serverBan.serverId}
                                className="border rounded-md p-3"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium">
                                    {formatServerName(serverBan.serverName)}
                                  </h4>
                                </div>
                                <div className="space-y-2">
                                  {serverBan.bans.map((crossBan: any) => (
                                    <div
                                      key={crossBan.banId}
                                      className="bg-muted p-2 rounded text-sm"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-mono">
                                          {crossBan.reason ||
                                            t("no_reason_provided")}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {t("banned")}{" "}
                                        {formatDistanceToNow(
                                          new Date(crossBan.bannedAt),
                                          { addSuffix: true }
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>
                </>
              </TabsContent>

              {/* Identifiers Tab */}
              <TabsContent value="identifiers" className="space-y-6">
                {(() => {
                  const allowedTypes = [
                    "IP",
                    "DISCORD",
                    "FIVEM",
                    "MICROSOFT",
                    "XBOX",
                    "STEAM",
                    "ROCKSTAR",
                    "ROCKSTAR2",
                  ];
                  const filteredIdentifiers =
                    ban.identifiers?.filter((identifier: any) =>
                      allowedTypes.includes(identifier.type.toUpperCase())
                    ) || [];

                  return filteredIdentifiers.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">
                        {t("banned_identifiers")}
                      </h3>
                      <div className="bg-muted p-3 rounded-md">
                        {filteredIdentifiers.map((identifier: any) => (
                          <div
                            key={identifier.id}
                            className="flex items-center justify-between py-1"
                          >
                            <code className="text-sm font-mono break-all">
                              {identifier.value}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(identifier.value)}
                              className="ml-2 h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {t("no_banned_identifiers")}
                      </p>
                    </div>
                  );
                })()}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("close")}
            </Button>
            <Button
              variant="outline"
              onClick={() => globalBanMutation.mutate({ banId: ban.id, serverId })}
              disabled={globalBanMutation.isPending}
              className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
            >
              <Globe className="h-4 w-4 mr-2" />
              {globalBanMutation.isPending ? "Submitting…" : "Submit to Global Ban"}
            </Button>
            {banStatus.status !== "expired" && (
              <Button
                variant="destructive"
                onClick={handleUnban}
                disabled={unbanMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {unbanMutation.isPending ? t("unbanning") : t("unban_player")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban Confirmation Dialog */}
      <AlertDialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unban_player")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("unban_confirmation", { playerName: ban.player.playerName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnban}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("unban_player")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Media Modal */}
      <Dialog open={!!mediaModal} onOpenChange={() => setMediaModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              {t("evidence")}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
            {mediaModal?.type === "image" && (
              <img
                src={mediaModal.url}
                alt="Evidence"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
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
                className="w-full h-auto max-h-[70vh] rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
