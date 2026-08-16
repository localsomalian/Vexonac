"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelectCombobox } from "@/components/ui/multi-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/hooks/use-session";
import { hasPermission } from "@/lib/utils";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { Permission } from "@vexonac/database";
import {
  Ban,
  ChevronDown,
  Download,
  Edit,
  FileText,
  Gavel,
  MoreHorizontal,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Terminal,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

// Permission mapping for display
const getPermissionLabels = (t: ReturnType<typeof useScopedI18n>) => ({
  ALL: {
    label: t("all_permissions"),
    description: t("all_permissions_description"),
    icon: <Shield className="h-4 w-4" />,
  },
  CONFIGURATION: {
    label: t("configuration"),
    description: t("configuration_description"),
    icon: <Settings className="h-4 w-4" />,
  },
  DOWNLOAD_FILES: {
    label: t("download_files"),
    description: t("download_files_description"),
    icon: <Download className="h-4 w-4" />,
  },
  MANAGE_ADMINS: {
    label: t("manage_admins"),
    description: t("manage_admins_description"),
    icon: <Users className="h-4 w-4" />,
  },
  BYPASS: {
    label: t("bypass"),
    description: t("bypass_description"),
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  PLAYERS_KICK: {
    label: t("players_kick"),
    description: t("players_kick_description"),
    icon: <Ban className="h-4 w-4" />,
  },
  MANAGE_BANS: {
    label: t("manage_bans"),
    description: t("manage_bans_description"),
    icon: <Gavel className="h-4 w-4" />,
  },
  UNBAN_ALL: {
    label: t("unban_all"),
    description: t("unban_all_description"),
    icon: <Ban className="h-4 w-4" />,
  },
  VIEW_LOGS: {
    label: t("view_logs"),
    description: t("view_logs_description"),
    icon: <FileText className="h-4 w-4" />,
  },
  VIEW_CONSOLE: {
    label: t("view_console"),
    description: t("view_console_description"),
    icon: <Terminal className="h-4 w-4" />,
  },
  RUN_COMMANDS: {
    label: t("run_commands"),
    description: t("run_commands_description"),
    icon: <Terminal className="h-4 w-4" />,
  },
  PLAYERS_LOOKUP: {
    label: t("players_lookup"),
    description: t("players_lookup_description"),
    icon: <Search className="h-4 w-4" />,
  },
});

// Types
interface ServerMember {
  id: string;
  discordId: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
  user: {
    discordId: string;
    name: string;
    username: string;
    image: string | null;
  };
}

interface SearchUser {
  discordId: string;
  name: string;
  username: string;
  image: string | null;
}

export default function ServerAdmins() {
  const params = useParams();
  const serverId = params.serverId as string;
  const { data: session } = useSession();

  const t = useScopedI18n("server_admins");

  // State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ServerMember | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [permissionFilters, setPermissionFilters] = useState<Permission[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Add Admin Dialog State
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    []
  );
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

  // Edit Admin Dialog State
  const [editPermissions, setEditPermissions] = useState<Permission[]>([]);

  // Fetch server data
  const { data: server, isLoading: isServerLoading } = useQuery(
    trpc.servers.getServer.queryOptions(serverId, {
      enabled: !!session?.user,
      staleTime: 30000,
    })
  );

  // Check permissions
  const isAllowed = useMemo(() => {
    if (!server) return false;
    if (server.isOwner) return true;
    if (server.permissions && Array.isArray(server.permissions)) {
      const permissions = server.permissions.map((p) =>
        String(p)
      ) as Permission[];
      return hasPermission(permissions, "MANAGE_ADMINS");
    }
    return false;
  }, [server, serverId]);

  // Fetch members data
  const {
    data: membersData,
    isLoading: isMembersLoading,
    refetch: refetchMembers,
  } = useQuery(
    trpc.servers.getServerMembers.queryOptions(
      {
        serverId,
        page: currentPage,
        limit: 10,
        search: searchQuery || undefined,
        permissions:
          permissionFilters.length > 0 ? permissionFilters : undefined,
      },
      {
        enabled: !!session?.user && isAllowed && !!serverId,
      }
    )
  );

  // Get current user and server owner info
  const currentUserId = session?.user?.id;
  const serverOwnerId = membersData?.serverOwnerId;

  // Search users for add dialog - Lower threshold and add debug
  const { data: searchResults, isLoading: isSearching } = useQuery(
    trpc.servers.searchUsers.queryOptions(
      {
        query: userSearchQuery.trim(),
        limit: 10,
      },
      {
        enabled: !!userSearchQuery && userSearchQuery.trim().length >= 1,
      }
    )
  );

  // Mutations
  const addMemberMutation = useMutation(
    trpc.servers.addServerMember.mutationOptions({
      onSuccess: () => {
        toast.success(t("admin_added_success"));
        setIsAddDialogOpen(false);
        setSelectedUser(null);
        setSelectedPermissions([]);
        setUserSearchQuery("");
        refetchMembers();
      },
      onError: (error: any) => {
        toast.error(error.message || t("admin_add_error"));
      },
    })
  );

  const updateMemberMutation = useMutation(
    trpc.servers.updateServerMember.mutationOptions({
      onSuccess: () => {
        toast.success(t("admin_updated_success"));
        setIsEditDialogOpen(false);
        setSelectedMember(null);
        setEditPermissions([]);
        refetchMembers();
      },
      onError: (error: any) => {
        toast.error(error.message || t("admin_update_error"));
      },
    })
  );

  const removeMemberMutation = useMutation(
    trpc.servers.removeServerMember.mutationOptions({
      onSuccess: () => {
        toast.success(t("admin_removed_success"));
        setIsDeleteDialogOpen(false);
        setSelectedMember(null);
        refetchMembers();
      },
      onError: (error: any) => {
        toast.error(error.message || t("admin_remove_error"));
      },
    })
  );

  // Helper function to check if a member can be edited/deleted
  const canModifyMember = useCallback(
    (member: ServerMember) => {
      // Can't modify server owner
      if (member.discordId === serverOwnerId) return false;
      // Non-owners can't modify themselves
      if (!server?.isOwner && member.discordId === currentUserId) return false;
      return true;
    },
    [serverOwnerId, server?.isOwner, currentUserId]
  );

  // Table columns
  const columns: ColumnDef<ServerMember>[] = [
    {
      accessorKey: "user",
      header: t("admin_column"),
      cell: ({ row }) => {
        const member = row.original;
        const isOwner = member.discordId === serverOwnerId;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={member.user.image || undefined}
                alt={member.user.name}
              />
              <AvatarFallback>
                {member.user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium">{member.user.name}</div>
                {isOwner && (
                  <Badge variant="destructive" className="text-xs">
                    {t("owner_badge")}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                @{member.user.username}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "discordId",
      header: t("discord_id_column"),
      cell: ({ row }) => (
        <code className="bg-muted px-2 py-1 rounded text-sm">
          {row.original.discordId}
        </code>
      ),
    },
    {
      accessorKey: "permissions",
      header: t("permissions_column"),
      cell: ({ row }) => {
        const permissions = row.original.permissions;
        if (permissions.includes("ALL")) {
          return (
            <Badge variant="destructive" className="gap-1">
              <Shield className="h-3 w-3" />
              {t("all_permissions")}
            </Badge>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {permissions.slice(0, 3).map((permission) => (
              <Badge key={permission} variant="secondary" className="text-xs">
                {getPermissionLabels(t)[permission].label}
              </Badge>
            ))}
            {permissions.length > 3 && (
              <Badge variant="outline" className="text-xs">
                {t("more_permissions", { count: permissions.length - 3 })}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: t("added_column"),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="text-sm">
            <div>{date.toLocaleDateString()}</div>
            <div className="text-muted-foreground">
              {date.toLocaleTimeString()}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: t("actions_column"),
      cell: ({ row }) => {
        const member = row.original;
        const canModify = canModifyMember(member);

        if (!canModify) {
          return (
            <div className="text-sm text-muted-foreground">
              {t("protected")}
            </div>
          );
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("actions_column")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <button
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded"
                onClick={() => handleEditMember(member)}
              >
                <Edit className="h-4 w-4" />
                {t("edit_permissions")}
              </button>
              <button
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-destructive hover:bg-accent rounded"
                onClick={() => handleDeleteMember(member)}
              >
                <Trash2 className="h-4 w-4" />
                {t("remove_admin")}
              </button>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Table setup
  const table = useReactTable({
    data: membersData?.members || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // Handlers
  const handleAddMember = useCallback(() => {
    if (!selectedUser || selectedPermissions.length === 0) {
      toast.error(t("select_user_and_permissions"));
      return;
    }

    addMemberMutation.mutate({
      serverId,
      discordId: selectedUser.discordId,
      permissions: selectedPermissions,
    });
  }, [selectedUser, selectedPermissions, serverId, addMemberMutation, t]);

  const handleEditMember = useCallback((member: ServerMember) => {
    setSelectedMember(member);
    setEditPermissions([...member.permissions]);
    setIsEditDialogOpen(true);
  }, []);

  const handleUpdateMember = useCallback(() => {
    if (!selectedMember || editPermissions.length === 0) {
      toast.error(t("select_at_least_one_permission"));
      return;
    }

    updateMemberMutation.mutate({
      serverId,
      memberId: selectedMember.id,
      permissions: editPermissions,
    });
  }, [selectedMember, editPermissions, serverId, updateMemberMutation, t]);

  const handleDeleteMember = useCallback((member: ServerMember) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleRemoveMember = useCallback(() => {
    if (!selectedMember) return;

    removeMemberMutation.mutate({
      serverId,
      memberId: selectedMember.id,
    });
  }, [selectedMember, serverId, removeMemberMutation]);

  const handlePermissionToggle = useCallback(
    (
      permission: Permission,
      permissions: Permission[],
      setPermissions: (perms: Permission[]) => void
    ) => {
      if (permission === "ALL") {
        if (permissions.includes("ALL")) {
          setPermissions([]);
        } else {
          setPermissions(["ALL"]);
        }
      } else {
        const newPermissions = permissions.includes(permission)
          ? permissions.filter((p) => p !== permission && p !== "ALL")
          : [...permissions.filter((p) => p !== "ALL"), permission];
        setPermissions(newPermissions);
      }
    },
    []
  );

  const resetAddDialog = useCallback(() => {
    setSelectedUser(null);
    setSelectedPermissions([]);
    setUserSearchQuery("");
    setIsUserSearchOpen(false);
  }, []);

  const resetEditDialog = useCallback(() => {
    setSelectedMember(null);
    setEditPermissions([]);
  }, []);

  // Loading states
  if (isServerLoading) {
    return (
      <ContentLayout
        title={t("admin_dashboard")}
        breadcrumb={{
          title: t("dashboard"),
          url: `/dashboard/server/${serverId}`,
        }}
      >
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
      </ContentLayout>
    );
  }

  // Access denied
  if (!isAllowed) {
    return (
      <ContentLayout
        title={formatServerName(server?.serverName || t("admin_dashboard"))}
        breadcrumb={{
          title: t("dashboard"),
          url: `/dashboard/server/${serverId}`,
        }}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <ShieldAlert className="h-16 w-16 text-destructive/60 mb-4" />
          <h2 className="text-2xl font-bold">{t("access_denied")}</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            {t("access_denied_description")}
          </p>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      title={formatServerName(server?.serverName || t("admin_dashboard"))}
      breadcrumb={{
        title: t("dashboard"),
        url: `/dashboard/server/${serverId}`,
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetAddDialog();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                {t("add_admin")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("add_new_admin")}</DialogTitle>
                <DialogDescription>
                  {t("add_admin_description")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* User Search */}
                <div className="space-y-2">
                  <Label>{t("select_user")}</Label>
                  <Popover
                    open={isUserSearchOpen}
                    onOpenChange={setIsUserSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isUserSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedUser ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={selectedUser.image || undefined}
                              />
                              <AvatarFallback>
                                {selectedUser.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {selectedUser.name} (@{selectedUser.username})
                            </span>
                          </div>
                        ) : (
                          t("search_user_placeholder")
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder={t("search_user_detailed_placeholder")}
                          value={userSearchQuery}
                          onValueChange={setUserSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {isSearching
                              ? t("searching")
                              : userSearchQuery
                              ? t("no_users_found")
                              : t("type_to_search")}
                          </CommandEmpty>
                          {searchResults?.users &&
                            searchResults.users.length > 0 && (
                              <CommandGroup>
                                {searchResults.users.map((user) => (
                                  <CommandItem
                                    key={user.discordId}
                                    value={`${user.discordId}-${user.name}-${user.username}`}
                                    onSelect={() => {
                                      setSelectedUser(user);
                                      setIsUserSearchOpen(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage
                                          src={user.image || undefined}
                                        />
                                        <AvatarFallback>
                                          {user.name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">
                                          {user.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          @{user.username} - {user.discordId}
                                        </div>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Permission Selection */}
                <div className="space-y-2">
                  <Label>{t("permissions_label")}</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {Object.entries(getPermissionLabels(t)).map(
                      ([permission, config]) => (
                        <div
                          key={permission}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`add-${permission}`}
                            checked={selectedPermissions.includes(
                              permission as Permission
                            )}
                            onCheckedChange={() =>
                              handlePermissionToggle(
                                permission as Permission,
                                selectedPermissions,
                                setSelectedPermissions
                              )
                            }
                          />
                          <Label
                            htmlFor={`add-${permission}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            {config.icon}
                            <div>
                              <div className="font-medium">{config.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {config.description}
                              </div>
                            </div>
                          </Label>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={handleAddMember}
                  disabled={
                    !selectedUser ||
                    selectedPermissions.length === 0 ||
                    addMemberMutation.isPending
                  }
                >
                  {addMemberMutation.isPending
                    ? t("adding")
                    : t("add_admin_button")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("filters_search")}</CardTitle>
            <CardDescription>{t("filters_search_description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* Permission Filter - Multi Select */}
              <div className="max-w-[400px] w-full sm:w-auto">
                <MultiSelectCombobox
                  label={t("permissions_filter")}
                  options={Object.entries(getPermissionLabels(t)).map(
                    ([permission, config]) => ({
                      value: permission as Permission,
                      label: config.label,
                    })
                  )}
                  value={permissionFilters}
                  onChange={(values: string[]) =>
                    setPermissionFilters(values as Permission[])
                  }
                  placeholder={t("search_placeholder")}
                  renderItem={(option) => (
                    <div className="flex items-center gap-2">
                      {getPermissionLabels(t)[option.value as Permission]?.icon}
                      <span>{option.label}</span>
                    </div>
                  )}
                  renderSelectedItem={(selectedValues) => (
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {selectedValues.length - 1} selected
                      </Badge>
                    </div>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription>
                  {membersData
                    ? t("admin_count", {
                        count: membersData.members.length,
                        plural: membersData.members.length !== 1 ? "s" : "",
                      })
                    : t("loading")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isMembersLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Users className="h-8 w-8 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {t("no_admins_found")}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {searchQuery || permissionFilters.length > 0
                                    ? t("no_admins_description")
                                    : t("no_admins_description_empty")}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {membersData && membersData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {t("page_of_pages", {
                        page: membersData.pagination.page,
                        total: membersData.pagination.totalPages,
                      })}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={!membersData.pagination.hasPrevPage}
                      >
                        {t("previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!membersData.pagination.hasNextPage}
                      >
                        {t("next")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) resetEditDialog();
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("edit_admin_permissions")}</DialogTitle>
              <DialogDescription>
                {t("edit_admin_description", {
                  name: selectedMember?.user.name,
                  username: selectedMember?.user.username,
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("permissions_label")}</Label>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {Object.entries(getPermissionLabels(t)).map(
                    ([permission, config]) => (
                      <div
                        key={permission}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`edit-${permission}`}
                          checked={editPermissions.includes(
                            permission as Permission
                          )}
                          onCheckedChange={() =>
                            handlePermissionToggle(
                              permission as Permission,
                              editPermissions,
                              setEditPermissions
                            )
                          }
                        />
                        <Label
                          htmlFor={`edit-${permission}`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {config.icon}
                          <div>
                            <div className="font-medium">{config.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {config.description}
                            </div>
                          </div>
                        </Label>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleUpdateMember}
                disabled={
                  editPermissions.length === 0 || updateMemberMutation.isPending
                }
              >
                {updateMemberMutation.isPending
                  ? t("updating")
                  : t("update_permissions")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("remove_admin_title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("remove_admin_description", {
                  name: selectedMember?.user.name,
                  username: selectedMember?.user.username,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                disabled={removeMemberMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {removeMemberMutation.isPending
                  ? t("removing")
                  : t("remove_admin")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ContentLayout>
  );
}

