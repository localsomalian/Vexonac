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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  User,
  Play,
  ImageIcon,
  FileText,
} from "lucide-react";
import { useState, useCallback, memo, useRef, useEffect } from "react";
import { toast } from "sonner";

interface BansTableProps {
  bans: any[];
  pagination?: any;
  loading: boolean;
  onPageChange: (page: number) => void;
  onBanClick: (ban: any) => void;
  onRefetch: () => void;
  serverId: string;
}

export function BansTable({
  bans,
  pagination,
  loading,
  onPageChange,
  onBanClick,
  onRefetch,
  serverId,
}: BansTableProps) {
  const t = useScopedI18n("bans_page");

  const [mediaModal, setMediaModal] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);

  const [mediaLoading, setMediaLoading] = useState(false);

  const [unbanConfirmation, setUnbanConfirmation] = useState<{
    banId: string;
    playerName: string;
  } | null>(null);

  const unbanMutation = useMutation(
    trpc.servers.unbanPlayer.mutationOptions({
      onSuccess: (data: any) => {
        toast.success(t("unban_success", { playerName: data.playerName }));
        onRefetch();
      },
      onError: (error: any) => {
        toast.error(error.message || t("unban_error"));
      },
    })
  );

  const handleUnban = async (banId: string, playerName: string) => {
    setUnbanConfirmation({ banId, playerName });
  };

  const confirmUnban = () => {
    if (unbanConfirmation) {
      unbanMutation.mutate({
        serverId,
        banId: unbanConfirmation.banId,
      });
      setUnbanConfirmation(null);
    }
  };

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const getBanStatus = (ban: any) => {
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

  const getMediaType = useCallback((url: string) => {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
      return "image";
    }
    if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i)) {
      return "video";
    }
    return "other";
  }, []);

  const handleMediaClick = useCallback((url: string, type: "image" | "video") => {
    setMediaLoading(true);
    setMediaModal({ url, type });
  }, []);

  const LazyImagePreview = memo(({ url }: { url: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div 
        ref={ref}
        className="w-16 h-12 rounded border overflow-hidden bg-muted flex items-center justify-center relative group"
      >
        <div
          className="w-full h-full bg-cover bg-center cursor-pointer hover:opacity-80 flex items-center justify-center transition-opacity"
          style={{
            backgroundImage: isVisible ? `url(${url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleMediaClick(url, "image");
          }}
          title="Click to view full image"
        >
          {!isVisible && (
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    );
  });

  LazyImagePreview.displayName = "LazyImagePreview";

  const LazyVideoPreview = memo(({ url }: { url: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, []);

    const handleVideoLoad = () => {
      setVideoLoaded(true);
      setHasError(false);
    };

    const handleVideoError = () => {
      setHasError(true);
      setVideoLoaded(false);
    };

    return (
      <div 
        ref={ref}
        className="w-16 h-12 rounded border overflow-hidden bg-muted flex items-center justify-center relative group"
      >
        {isVisible && !hasError && (
          <video
            ref={videoRef}
            src={url}
            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
            muted
            playsInline
            preload="metadata"
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            onClick={(e) => {
              e.stopPropagation();
              handleMediaClick(url, "video");
            }}
            title="Click to view video"
            style={{ 
              display: videoLoaded ? 'block' : 'none',
            }}
          />
        )}
        
        {(!isVisible || !videoLoaded || hasError) && (
          <div 
            className="w-full h-full cursor-pointer hover:bg-muted/80 flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleMediaClick(url, "video");
            }}
            title="Click to view video"
          >
            <Play className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        )}

        {/* Play button overlay when video is loaded */}
        {videoLoaded && !hasError && (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 rounded-full p-1">
              <Play className="h-4 w-4 text-white fill-white" />
            </div>
          </div>
        )}
      </div>
    );
  });

  LazyVideoPreview.displayName = "LazyVideoPreview";

  const EvidenceCell = memo(({ evidenceUrl }: { evidenceUrl: string | null }) => {
    if (!evidenceUrl) {
      return (
        <span className="text-xs text-muted-foreground">
          {t("no_evidence")}
        </span>
      );
    }

    const mediaType = getMediaType(evidenceUrl);

    if (mediaType === "image") {
      return <LazyImagePreview url={evidenceUrl} />;
    }

    if (mediaType === "video") {
      return <LazyVideoPreview url={evidenceUrl} />;
    }

    // For other URLs, show a link icon
    return (
      <div className="w-16 h-12 rounded border overflow-hidden bg-muted flex items-center justify-center relative group">
        <a
          href={evidenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-full flex items-center justify-center hover:bg-muted/80 transition-colors"
          onClick={(e) => e.stopPropagation()}
          title="Click to view evidence"
        >
          <FileText className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </a>
      </div>
    );
    });

  EvidenceCell.displayName = "EvidenceCell";

  const renderEvidence = (evidenceUrl: string | null) => {
    return <EvidenceCell evidenceUrl={evidenceUrl} />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("ban_records")}</CardTitle>
          <CardDescription>{t("loading_ban_records")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bans.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("no_bans_found")}
          </CardTitle>
          <CardDescription>{t("no_bans_description")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            {t("ban_records")}
          </CardTitle>
          <CardDescription>
            {t("total_bans_found", {
              count: pagination?.totalCount || 0,
              plural: pagination?.totalCount !== 1 ? "s" : "",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("player")}</TableHead>
                  <TableHead>{t("ban_id")}</TableHead>
                  <TableHead>{t("reason")}</TableHead>
                  <TableHead>{t("evidence")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("banned_at")}</TableHead>
                  <TableHead>{t("first_join")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bans.map((ban) => {
                  const banStatus = getBanStatus(ban);
                  return (
                    <TableRow
                      key={ban.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium max-w-[200px] truncate">
                              {ban.player?.playerName ?? "Unknown Player"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t("played")}{" "}
                              {ban.player ? formatPlayTime(ban.player.playTime) : "—"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          #{ban.banId}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-[200px] truncate"
                          title={ban.reason}
                        >
                          {ban.reason || t("no_reason_provided")}
                        </div>
                      </TableCell>
                      <TableCell>{renderEvidence(ban.evidenceUrl)}</TableCell>
                      <TableCell>
                        <Badge variant={banStatus.variant}>
                          {banStatus.status === "permanent" && (
                            <Shield className="h-3 w-3 mr-1" />
                          )}
                          {banStatus.status === "temporary" && (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {banStatus.status === "expired" && (
                            <ShieldOff className="h-3 w-3 mr-1" />
                          )}
                          {banStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(ban.bannedAt), "MMM dd, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(ban.bannedAt), "HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ban.player?.firstJoin ? (
                          <>
                            <div className="text-sm">
                              {format(new Date(ban.player.firstJoin), "MMM dd, yyyy")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(ban.player.firstJoin), { addSuffix: true })}
                            </div>
                          </>
                        ) : <div className="text-sm text-muted-foreground">—</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onBanClick(ban);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              window.open(
                                `/dashboard/server/${serverId}/lookup?license=${ban.player.playerLicense}`,
                                "_blank"
                              );
                            }}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          {banStatus.status !== "expired" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnban(ban.banId, ban.player.playerName);
                              }}
                              disabled={unbanMutation.isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              {unbanMutation.isPending ? (
                                t("unbanning")
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                {t("showing_results", {
                  start: (pagination.page - 1) * pagination.limit + 1,
                  end: Math.min(
                    pagination.page * pagination.limit,
                    pagination.totalCount
                  ),
                  total: pagination.totalCount,
                })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("previous")}
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === pagination.page ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => onPageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  {t("next")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Modal */}
      <Dialog open={!!mediaModal} onOpenChange={() => {
        setMediaModal(null);
        setMediaLoading(false);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              {t("evidence")}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
            {mediaLoading && (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            {mediaModal?.type === "image" && (
              <img
                src={mediaModal.url}
                alt="Evidence"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                onLoad={() => setMediaLoading(false)}
                onError={() => setMediaLoading(false)}
                onLoadStart={() => setMediaLoading(true)}
                style={{ display: mediaLoading ? 'none' : 'block' }}
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
                onLoadStart={() => setMediaLoading(true)}
                onCanPlay={() => setMediaLoading(false)}
                onError={() => setMediaLoading(false)}
                style={{ display: mediaLoading ? 'none' : 'block' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Unban Confirmation Dialog */}
      <AlertDialog
        open={!!unbanConfirmation}
        onOpenChange={() => setUnbanConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unban_player")}</AlertDialogTitle>
            <AlertDialogDescription>
              {unbanConfirmation &&
                t("unban_confirmation", {
                  playerName: unbanConfirmation.playerName,
                })}
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
    </>
  );
}
