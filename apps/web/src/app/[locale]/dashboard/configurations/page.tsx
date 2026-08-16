"use client";
import { ContentLayout } from "@/components/content-layout";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Copy,
  Download,
  Edit2,
  Eye,
  Filter,
  Globe,
  Loader2,
  Lock,
  MoreHorizontal,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Predefined tags only (should match backend)
const TAGS = ["Role-Play", "PvP", "Strict", "Performance", "Balanced"] as const;

// Tag color mapping for UI
const getTagColor = (tag: string) => {
  const colors: Record<string, string> = {
    "Role-Play":
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    PvP: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    Strict:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    Performance:
      "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
    Balanced:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };
  return (
    colors[tag] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  );
};

// Helper function to get user initials from username
const getUserInitials = (username: string) => {
  if (!username) return "??";
  const parts = username.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]?.substring(0, 2).toUpperCase() ?? "??";
  }
  return (
    (parts[0]?.[0] ?? "?") + (parts[parts.length - 1]?.[0] ?? "?")
  ).toUpperCase();
};

// Helper function to generate avatar URL using DiceBear API
const getAvatarUrl = (username: string) => {
  if (!username) return undefined;
  // Using DiceBear's initials style for consistent avatars
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    username
  )}&backgroundColor=3b82f6,8b5cf6,10b981,f59e0b,ef4444&textColor=ffffff`;
};

// Configuration card component for public configurations
interface ConfigCardProps {
  config: {
    id: string;
    name: string | null;
    description: string | null;
    tags: string[];
    createdBy: {
      username: string;
      image: string | null;
      discordId: string;
    } | null;
    createdAt: string | Date;
    importCount: number;
    viewCount: number;
  };
  onImport: (id: string) => void;
  onPreview: (id: string) => void;
  isLoading?: boolean;
  isImporting?: boolean;
}

function ConfigCard({
  config,
  onImport,
  onPreview,
  isLoading,
  isImporting,
}: ConfigCardProps) {
  const t = useScopedI18n("config_library");
  return (
    <Card className="group hover:shadow-md transition-shadow flex flex-col h-full">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6 cursor-pointer">
                    <AvatarImage
                      src={
                        config.createdBy?.image ||
                        getAvatarUrl(config.createdBy?.username || "Unknown")
                      }
                      alt={config.createdBy?.username || "Unknown"}
                    />
                    <AvatarFallback className="text-xs">
                      {getUserInitials(config.createdBy?.username || "Unknown")}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {t("created_by")}{" "}
                    {config.createdBy?.username || t("unknown_user")}
                  </p>
                </TooltipContent>
              </Tooltip>
              <CardTitle className="text-lg line-clamp-1">
                {config.name || `Configuration ${config.id}`}
              </CardTitle>
            </div>
            <div className="flex items-start">
              {config.description ? (
                <CardDescription className="line-clamp-2">
                  {config.description}
                </CardDescription>
              ) : (
                <CardDescription className="text-muted-foreground/60">
                  {t("no_description")}
                </CardDescription>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="min-h-[32px] flex items-center">
          {config.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-2">
              {config.tags.map((tag) => (
                <Badge key={tag} className={`text-xs ${getTagColor(tag)}`}>
                  {" "}
                  {tag}{" "}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="pt-2">
              <Badge variant="outline" className="text-xs">
                {t("no_tags")}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 mt-auto">
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              <span>{config.importCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{config.viewCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(config.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(config.id)}
            className="flex-1"
            disabled={isLoading}
          >
            <Eye className="w-4 h-4 mr-2" />
            {t("preview")}
          </Button>
          <Button
            size="sm"
            onClick={() => onImport(config.id)}
            className="flex-1"
            disabled={isLoading || isImporting}
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isImporting ? t("importing") : t("import")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ConfigurationsPage() {
  const { data: session } = authClient.useSession();
  const t = useScopedI18n("config_library");

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "popular" | "name"
  >("newest");
  const [page, setPage] = useState(1);
  const [importingId, setImportingId] = useState<string | null>(null);

  // Dialog states
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    id: string | null;
  }>({ open: false, id: null });

  const [editDialog, setEditDialog] = useState<{ open: boolean; config: any }>({
    open: false,
    config: null,
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string | null;
  }>({ open: false, id: null });

  // Edit form state with proper typing
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    tags: (typeof TAGS)[number][];
    isPublic: boolean;
  }>({
    name: "",
    description: "",
    tags: [],
    isPublic: false,
  });

  // Browse public configurations
  const {
    data: publicConfigs,
    isLoading: isLoadingPublic,
    refetch: refetchPublic,
  } = useQuery(
    trpc.servers.browseConfigs.queryOptions({
      search: searchQuery || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      sortBy,
      page,
      limit: 12,
    })
  );

  // Get user's configurations
  const {
    data: userConfigs,
    isLoading: isLoadingUser,
    refetch: refetchUser,
  } = useQuery(
    trpc.servers.getUserConfigs.queryOptions(
      {
        page: 1,
        limit: 20,
      },
      {
        enabled: !!session?.user,
      }
    )
  );

  // Get configuration details for preview
  const { data: previewConfig, isLoading: isPreviewLoading } = useQuery(
    trpc.servers.getConfigDetails.queryOptions(
      { id: previewDialog.id! },
      {
        enabled: !!previewDialog.id,
      }
    )
  );

  // Mutations
  const trackImportMutation = useMutation(
    trpc.servers.trackImport.mutationOptions({
      onSuccess: () => {
        refetchPublic();
      },
      onError: (error: any) => {
        console.error("Failed to track import:", error);
        // Don't show error to user since the main action (copy) still works
      },
    })
  );

  const updateConfigMutation = useMutation(
    trpc.servers.updateConfig.mutationOptions({
      onSuccess: () => {
        toast.success(t("config_updated"));
        setEditDialog({ open: false, config: null });
        refetchUser();
      },
      onError: (error: any) => {
        toast.error(t("failed_to_update"), {
          description: error.message,
        });
      },
    })
  );

  const deleteConfigMutation = useMutation(
    trpc.servers.deleteConfig.mutationOptions({
      onSuccess: () => {
        toast.success(t("config_deleted"));
        setDeleteDialog({ open: false, id: null });
        refetchUser();
      },
      onError: (error: any) => {
        toast.error(t("failed_to_delete"), {
          description: error.message,
        });
      },
    })
  );

  // Handle import (copies to clipboard and tracks import count)
  const handleImport = async (id: string) => {
    setImportingId(id);

    try {
      // Track the import (increment count) - fire and forget
      trackImportMutation.mutate({ id });

      // Copy to clipboard
      await navigator.clipboard.writeText(id);

      toast.success(t("config_id_copied"), {
        description: t("config_id_copied_description"),
      });
    } catch (error: any) {
      // If clipboard fails, show error
      toast.error(t("failed_to_copy"));
    } finally {
      setImportingId(null);
    }
  };

  // Handle preview
  const handlePreview = (id: string) => {
    setPreviewDialog({ open: true, id });
  };

  // Handle tag toggle
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Handle configuration management actions
  const handleEditConfig = (config: any) => {
    setEditForm({
      name: config.name || "",
      description: config.description || "",
      tags: (config.tags || []).filter((tag: string) =>
        TAGS.includes(tag as (typeof TAGS)[number])
      ) as (typeof TAGS)[number][],
      isPublic: config.isPublic || false,
    });
    setEditDialog({ open: true, config });
  };

  const handleDeleteConfig = (id: string) => {
    setDeleteDialog({ open: true, id });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.id) {
      deleteConfigMutation.mutate({ id: deleteDialog.id });
    }
  };

  const handleToggleVisibility = (config: any) => {
    updateConfigMutation.mutate({
      id: config.id,
      isPublic: !config.isPublic,
    });
  };

  const handleUpdateConfig = () => {
    if (!editDialog.config) return;

    updateConfigMutation.mutate({
      id: editDialog.config.id,
      name: editForm.name || undefined,
      description: editForm.description || undefined,
      tags: editForm.tags,
      isPublic: editForm.isPublic,
    });
  };

  return (
    <TooltipProvider>
      <ContentLayout
        title={t("title")}
        breadcrumb={{
          title: t("dashboard"),
          url: "/dashboard",
        }}
      >
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t("browse_public")}
            </TabsTrigger>
            <TabsTrigger value="my-configs" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t("my_configurations")}
            </TabsTrigger>
          </TabsList>

          {/* Browse Public Configurations */}
          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  {t("search_filters")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label htmlFor="search">{t("search_placeholder")}</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder={t("search_placeholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sort */}
                  <div className="space-y-2">
                    <Label>{t("sort_by")}</Label>
                    <Select
                      value={sortBy}
                      onValueChange={(value: any) => setSortBy(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">
                          {t("newest_first")}
                        </SelectItem>
                        <SelectItem value="oldest">
                          {t("oldest_first")}
                        </SelectItem>
                        <SelectItem value="popular">
                          {t("most_popular")}
                        </SelectItem>
                        <SelectItem value="name">{t("name_az")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tags Filter */}
                <div className="space-y-2">
                  <Label>{t("tags")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        variant={
                          selectedTags.includes(tag) ? "default" : "outline"
                        }
                        className={`cursor-pointer hover:bg-opacity-80 ${
                          selectedTags.includes(tag) ? getTagColor(tag) : ""
                        }`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              {isLoadingPublic ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : publicConfigs?.configurations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <Search className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {t("no_configs_found")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("no_configs_description")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {publicConfigs?.pagination.totalCount}{" "}
                      {t("configs_found")}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publicConfigs?.configurations.map((config: any) => (
                      <ConfigCard
                        key={config.id}
                        config={config}
                        onImport={handleImport}
                        onPreview={handlePreview}
                        isImporting={importingId === config.id}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {publicConfigs && publicConfigs.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={!publicConfigs.pagination.hasPrevPage}
                      >
                        {t("previous")}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {t("page_of", {
                          page: publicConfigs.pagination.page,
                          total: publicConfigs.pagination.totalPages,
                        })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={!publicConfigs.pagination.hasNextPage}
                      >
                        {t("next")}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* My Configurations */}
          <TabsContent value="my-configs" className="space-y-6">
            {!session?.user ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t("sign_in_required")}
                  </h3>
                  <p className="text-muted-foreground">
                    {t("sign_in_description")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {t("your_shared_configs")}
                  </h2>
                </div>

                {isLoadingUser ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="h-3 bg-muted rounded" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : userConfigs?.configurations.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                      <Settings className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {t("no_configs_shared")}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {t("no_configs_shared_description")}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userConfigs?.configurations.map((config: any) => (
                      <Card
                        key={config.id}
                        className="group flex flex-col h-full"
                      >
                        <CardHeader className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Avatar className="h-6 w-6 cursor-pointer">
                                      <AvatarImage
                                        src={
                                          session?.user?.image ||
                                          getAvatarUrl(
                                            session?.user?.name || "User"
                                          )
                                        }
                                        alt={session?.user?.name || "User"}
                                      />
                                      <AvatarFallback className="text-xs">
                                        {getUserInitials(
                                          session?.user?.name || "User"
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {t("created_by")}{" "}
                                      {session?.user?.name || t("you")}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                                <CardTitle className="text-lg line-clamp-1">
                                  {config.name || `Configuration ${config.id}`}
                                </CardTitle>
                              </div>
                              <div className="flex items-start">
                                {config.description ? (
                                  <CardDescription className="line-clamp-2">
                                    {config.description}
                                  </CardDescription>
                                ) : (
                                  <CardDescription className="text-muted-foreground/60">
                                    {t("no_description")}
                                  </CardDescription>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {config.isPublic ? (
                                <Badge className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {t("public")}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  <Lock className="w-3 h-3" />
                                  {t("private")}
                                </Badge>
                              )}

                              {/* Management Menu */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEditConfig(config)}
                                  >
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    {t("edit_details")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleVisibility(config)
                                    }
                                  >
                                    {config.isPublic ? (
                                      <>
                                        <Lock className="w-4 h-4 mr-2" />
                                        {t("make_private")}
                                      </>
                                    ) : (
                                      <>
                                        <Globe className="w-4 h-4 mr-2" />
                                        {t("make_public")}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      navigator.clipboard.writeText(config.id);
                                      toast.success(t("share_id_copied"));
                                    }}
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    {t("copy_share_id")}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDeleteConfig(config.id)
                                    }
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {t("delete")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="min-h-[32px] flex items-center">
                            {config.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1 pt-2">
                                {" "}
                                {config.tags.map((tag: any) => (
                                  <Badge
                                    key={tag}
                                    className={`text-xs ${getTagColor(tag)}`}
                                  >
                                    {" "}
                                    {tag}{" "}
                                  </Badge>
                                ))}{" "}
                              </div>
                            ) : (
                              <div className="pt-2">
                                <Badge variant="outline" className="text-xs">
                                  {t("no_tags")}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0 mt-auto">
                          {/* Stats */}
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                <span>{config.importCount}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{config.viewCount}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(
                                  config.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Preview Dialog */}
        <Dialog
          open={previewDialog.open}
          onOpenChange={(open) => setPreviewDialog({ open, id: null })}
        >
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{t("config_preview")}</DialogTitle>
            </DialogHeader>

            {isPreviewLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : previewConfig ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Creator info */}
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={
                        previewConfig.configuration.createdBy?.image ||
                        getAvatarUrl(
                          previewConfig.configuration.createdBy?.username ||
                            "Unknown"
                        )
                      }
                      alt={
                        previewConfig.configuration.createdBy?.username ||
                        "Unknown"
                      }
                    />
                    <AvatarFallback>
                      {getUserInitials(
                        previewConfig.configuration.createdBy?.username ||
                          "Unknown"
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {t("created_by")}{" "}
                      {previewConfig.configuration.createdBy?.username ||
                        t("unknown_user")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        previewConfig.configuration.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="">
                  <h4 className="font-medium mb-2">{t("config_data")}</h4>
                  <ScrollArea className="h-[300px] w-full rounded-md border">
                    {" "}
                    <pre className="text-xs p-4 whitespace-pre-wrap break-words">
                      {" "}
                      {String(
                        JSON.stringify(
                          (previewConfig as any).configuration.configuration,
                          null,
                          2
                        )
                      )}{" "}
                    </pre>{" "}
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                {t("failed_to_load")}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog({ open, config: null })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("edit_config")}</DialogTitle>
              <DialogDescription>
                {t("edit_config_description")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("name")}</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder={t("name")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">{t("description")}</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder={t("description")}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("tags")}</Label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      className={`cursor-pointer ${
                        editForm.tags.includes(tag)
                          ? getTagColor(tag)
                          : "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                      }`}
                      onClick={() => {
                        setEditForm((prev) => ({
                          ...prev,
                          tags: prev.tags.includes(tag)
                            ? prev.tags.filter((t) => t !== tag)
                            : prev.tags.length < 5
                            ? [...prev.tags, tag]
                            : prev.tags,
                        }));
                      }}
                    >
                      {" "}
                      {tag}{" "}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("max_tags", { count: editForm.tags.length })}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-public"
                  checked={editForm.isPublic}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      isPublic: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="edit-public">
                  {t("make_public_searchable")}
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialog({ open: false, config: null })}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleUpdateConfig}
                disabled={updateConfigMutation.isPending}
              >
                {updateConfigMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {t("save_changes")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteDialog.open}
          onOpenChange={(open) => setDeleteDialog({ open, id: null })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("delete_config")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("delete_config_description")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={deleteConfigMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteConfigMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ContentLayout>
    </TooltipProvider>
  );
}
