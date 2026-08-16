"use client";

import { ContentLayout } from "@/components/content-layout";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useScopedI18n } from "@/locales/client";
import { trpc, queryClient } from "@/utils/trpc";
import type { RouterOutputs } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { APIPlan, APIPlans, APIKeyPermissions, APIKeyPermission } from "@vexonac/types";
import { Copy, MoreHorizontal, Plus, Trash2, CreditCard, Sparkles, Shield, Edit, Eye, EyeOff, Server, X, BookText, Code } from "lucide-react";
import { formatServerName } from "@/components/format-server-name";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";

// Schema for creating API Key
const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  permissions: z.array(z.string()).optional(),
  licenseId: z.string().optional(),
});

const updateApiKeySchema = z.object({
    name: z.string().min(1, "Name is required").max(50),
    permissions: z.array(z.string()).optional(),
    licenseId: z.string().optional().nullable(),
});

type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>;
type UpdateApiKeyFormValues = z.infer<typeof updateApiKeySchema>;

// Helper type for API Key from router output
type ApiKey = RouterOutputs["apikeys"]["list"][number];

export default function APIKeysPage() {
  const t = useScopedI18n("api_keys");
  const { data: session } = authClient.useSession();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  
  const [createdKey, setCreatedKey] = useState<{
    accessKey: string;
    secretKey: string;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Visibility states
  const [showAccessKey, setShowAccessKey] = useState<Record<string, boolean>>({});
  const [showSecretKey, setShowSecretKey] = useState<Record<string, boolean>>({});
  const [showCreatedSecret, setShowCreatedSecret] = useState(false);
  const [showCreatedAccess, setShowCreatedAccess] = useState(false);

  // Queries
  const { data: apiKeys, isLoading } = useQuery(trpc.apikeys.list.queryOptions());
  
  // Get user servers (only owned servers)
  const { data: allUserServers, isLoading: serversLoading } = useQuery(
    trpc.users.getUserServersList.queryOptions("all", {
      enabled: session?.user !== undefined,
      staleTime: 30000,
    })
  );
  const userServers = (allUserServers as any)?.filter((server: any) => server.isOwner) || [];

  // Mutations
  const createMutation = useMutation(trpc.apikeys.create.mutationOptions({
    onSuccess: (data) => {
      toast.success("API Key created successfully");
      setCreatedKey({
        accessKey: data.accessKey,
        secretKey: data.secretKey!, // secretKey is present on creation
      });
      queryClient.invalidateQueries({
        queryKey: [["apikeys", "list"]],
      });
      setIsCreateOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create API key");
    },
  }));

  const deleteMutation = useMutation(trpc.apikeys.delete.mutationOptions({
    onSuccess: () => {
      toast.success("API Key deleted successfully");
      setDeleteId(null);
      queryClient.invalidateQueries({
        queryKey: [["apikeys", "list"]],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete API key");
    },
  }));

  const updateMutation = useMutation(trpc.apikeys.update.mutationOptions({
    onSuccess: () => {
      toast.success("API Key updated successfully");
      queryClient.invalidateQueries({
        queryKey: [["apikeys", "list"]],
      });
      setIsEditOpen(false);
      setEditingKey(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update API key");
    },
  }));


  // Form
  const form = useForm<CreateApiKeyFormValues>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
      permissions: Object.keys(APIKeyPermissions),
      licenseId: undefined,
    },
  });

  const editForm = useForm<UpdateApiKeyFormValues>({
      resolver: zodResolver(updateApiKeySchema),
      defaultValues: {
          name: "",
          permissions: [],
          licenseId: undefined,
      }
  });

  const onSubmit = (data: CreateApiKeyFormValues) => {
    const permissionsObj: Record<string, boolean> = {};
    if (data.permissions) {
        data.permissions.forEach(p => {
            permissionsObj[p] = true;
        });
    }

    createMutation.mutate({
      name: data.name,
      permissions: permissionsObj,
      licenseId: data.licenseId || undefined,
    });
  };

  const onEditSubmit = (data: UpdateApiKeyFormValues) => {
      if (!editingKey) return;

      const permissionsObj: Record<string, boolean> = {};
      if (data.permissions) {
          data.permissions.forEach(p => {
              permissionsObj[p] = true;
          });
      }

      updateMutation.mutate({
          id: editingKey.id,
          name: data.name,
          permissions: permissionsObj,
          licenseId: data.licenseId,
      });
  };

  const openEditDialog = (key: ApiKey) => {
      setEditingKey(key);
      // Extract permissions from key (assuming stored as JSON object)
      const currentPerms = key.permissions as Record<string, boolean> || {};
      const activePerms = Object.keys(currentPerms).filter(k => currentPerms[k] === true);
      
      editForm.reset({
          name: key.name || "",
          permissions: activePerms.length > 0 ? activePerms : Object.keys(APIKeyPermissions),
          licenseId: key.licenseId || undefined,
      });
      setIsEditOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Helper to get usage percentage
  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === 0) return 100;
    return Math.min(100, (current / limit) * 100);
  };
  
  const handlePlanUpdate = (id: string, plan: APIPlan) => {
      updateMutation.mutate({
          id,
          tier: plan
      });
  };

  const toggleAccessKeyVisibility = (id: string) => {
      setShowAccessKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSecretKeyVisibility = (id: string) => {
      setShowSecretKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskString = (str: string, visibleChars = 8) => {
      if (!str) return "";
      if (str.length <= visibleChars) return str;
      return `${str.substring(0, visibleChars)}...${str.substring(str.length - 4)}`;
  };

  return (
    <ContentLayout
      title={t("title")}
      breadcrumb={{
        title: t("dashboard"),
        url: `/dashboard`,
      }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/api-docs" target="_blank">
                <Code className="mr-2 h-4 w-4" />
                API Docs
              </Link>
            </Button>
            <Button onClick={() => {
              if (apiKeys && apiKeys.length >= 10) {
                  toast.error("Maximum limit of 10 API keys reached");
                  return;
              }
              setIsCreateOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              {t("create_api_key")}
            </Button>
          </div>
        </div>

        {/* API Keys List - Mobile View */}
        <div className="lg:hidden space-y-4">
            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                </div>
            ) : apiKeys?.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                        <div className="p-4 rounded-full bg-primary/10 text-primary">
                            <Shield className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">{t("no_keys_found")}</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                               Ready to integrate? Create your first API key to get started. 
                               You'll start on a basic plan which you can upgrade anytime.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t("create_api_key")}
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/pricing">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    View Plans
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                (apiKeys as unknown as ApiKey[])?.map((key) => (
                    <Card key={key.id}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base truncate">{key.name}</CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                            {APIPlans[key.tier as unknown as APIPlan]?.name || key.tier}
                                        </Badge>
                                        <Badge
                                            variant={key.status === "ACTIVE" ? "default" : "secondary"}
                                            className="text-xs"
                                        >
                                            {t(key.status.toLowerCase() as any)}
                                        </Badge>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="shrink-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEditDialog(key)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            {t("edit")}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuLabel>Manage Plan</DropdownMenuLabel>
                                        {Object.values(APIPlan).map((plan) => (
                                            <DropdownMenuItem 
                                                key={plan}
                                                disabled={key.tier === plan}
                                                onClick={() => handlePlanUpdate(key.id, plan)}
                                            >
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                Switch to {APIPlans[plan].name}
                                            </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => setDeleteId(key.id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t("delete")}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <div className="text-xs text-muted-foreground mb-1.5">{t("access_key_label")}</div>
                                <div className="flex items-center gap-1 bg-muted/50 p-2 rounded font-mono text-xs">
                                    <span className="flex-1 truncate">
                                        {showAccessKey[key.id] ? key.accessKey : maskString(key.accessKey, 10)}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                        onClick={() => toggleAccessKeyVisibility(key.id)}
                                    >
                                        {showAccessKey[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                        onClick={() => copyToClipboard(key.accessKey, t("access_key_label"))}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground mb-1.5">{t("secret_key_label")}</div>
                                <div className="flex items-center gap-1 bg-muted/50 p-2 rounded font-mono text-xs">
                                    <span className="flex-1 truncate">
                                        {(key as any).maskedSecretKey || "••••••••"}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                        disabled
                                        title="Secret key cannot be viewed after creation"
                                    >
                                        <EyeOff className="h-3 w-3 opacity-50" />
                                    </Button>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-muted-foreground">{t("usage")}</span>
                                    <span className="font-medium">
                                        {getUsagePercentage(key.currentMonthlyUsage, key.monthlyRequestLimit).toFixed(0)}%
                                    </span>
                                </div>
                                <Progress 
                                    value={getUsagePercentage(key.currentMonthlyUsage, key.monthlyRequestLimit)} 
                                    className="h-2" 
                                />
                                <div className="text-xs text-muted-foreground mt-1">
                                    {key.currentMonthlyUsage} / {key.monthlyRequestLimit} requests
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t">
                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                    <span>{t("created_at")}</span>
                                    <span>{new Date(key.createdAt).toLocaleDateString()}</span>
                                </div>
                                {key.license && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <Server className="h-3 w-3 text-violet-500" />
                                        <span className="text-muted-foreground">{t("linked_server")}:</span>
                                        <span className="font-medium">{formatServerName(key.license.serverName)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>

        {/* API Keys List - Desktop View */}
        <div className="hidden lg:block">
            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                </div>
            ) : apiKeys?.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                        <div className="p-4 rounded-full bg-primary/10 text-primary">
                            <Shield className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">{t("no_keys_found")}</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                               Ready to integrate? Create your first API key to get started. 
                               You'll start on a basic plan which you can upgrade anytime.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                {t("create_api_key")}
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/pricing">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    View Plans
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>{t("title")}</CardTitle>
                        <CardDescription>
                            {apiKeys?.length ? `${apiKeys.length} keys found` : t("no_keys_found")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("name_label")}</TableHead>
                                    <TableHead>{t("access_key_label")}</TableHead>
                                    <TableHead>{t("secret_key_label")}</TableHead>
                                    <TableHead>{t("linked_server")}</TableHead>
                                    <TableHead>{t("plan_label")}</TableHead>
                                    <TableHead>{t("usage")}</TableHead>
                                    <TableHead>{t("status")}</TableHead>
                                    <TableHead>{t("created_at")}</TableHead>
                                    <TableHead className="text-right">{t("actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(apiKeys as unknown as ApiKey[])?.map((key) => (
                                    <TableRow key={key.id}>
                                        <TableCell className="font-medium">{key.name}</TableCell>
                                        <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-2 min-w-[200px]">
                                                <span className="truncate">
                                                    {showAccessKey[key.id] ? key.accessKey : maskString(key.accessKey, 10)}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={() => toggleAccessKeyVisibility(key.id)}
                                                >
                                                    {showAccessKey[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={() => copyToClipboard(key.accessKey, t("access_key_label"))}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            <div className="flex items-center gap-2 min-w-[150px]">
                                                <span className="truncate">
                                                    {(key as any).maskedSecretKey || "••••••••"}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0 opacity-50"
                                                    disabled
                                                    title="Secret key cannot be viewed after creation"
                                                >
                                                    <EyeOff className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {key.license ? (
                                                <div className="flex items-center gap-2">
                                                    <Server className="h-4 w-4 text-violet-500" />
                                                    <span className="text-sm">{formatServerName(key.license.serverName)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">{t("no_server")}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {APIPlans[key.tier as unknown as APIPlan]?.name || key.tier}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="w-[200px]">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span>
                                                        {key.currentMonthlyUsage} / {key.monthlyRequestLimit}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {getUsagePercentage(key.currentMonthlyUsage, key.monthlyRequestLimit).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={getUsagePercentage(key.currentMonthlyUsage, key.monthlyRequestLimit)}
                                                    className="h-2"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={key.status === "ACTIVE" ? "default" : "secondary"}
                                            >
                                                {t(key.status.toLowerCase() as any)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(key.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditDialog(key)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        {t("edit")}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel>Manage Plan</DropdownMenuLabel>
                                                    {Object.values(APIPlan).map((plan) => (
                                                        <DropdownMenuItem 
                                                            key={plan}
                                                            disabled={key.tier === plan}
                                                            onClick={() => handlePlanUpdate(key.id, plan)}
                                                        >
                                                            <Sparkles className="mr-2 h-4 w-4" />
                                                            Switch to {APIPlans[plan].name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setDeleteId(key.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        {t("delete")}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Create Dialog */}
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) form.reset();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("create_api_key")}</DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name_label")}</FormLabel>
                      <FormControl>
                        <Input placeholder="My App" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissions"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t("permissions_label")}</FormLabel>
                      <div className="grid grid-cols-1 gap-2 border rounded-md p-4 max-h-[200px] overflow-y-auto">
                        {Object.entries(APIKeyPermissions).map(([key, value]) => (
                          <FormField
                            key={key}
                            control={form.control}
                            name="permissions"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={key}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(key)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), key])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== key
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {value.name}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("server_label")}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ""}
                        disabled={serversLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_server")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {userServers.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No servers available
                            </SelectItem>
                          ) : (
                            userServers.map((server: any) => (
                              <SelectItem key={server.id} value={server.id}>
                                {formatServerName(server.serverName)}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? t("create") + "..." : t("create")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
                setEditingKey(null);
                editForm.reset();
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("edit")}</DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onEditSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name_label")}</FormLabel>
                      <FormControl>
                        <Input placeholder="My App" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="permissions"
                  render={() => (
                    <FormItem>
                      <FormLabel>{t("permissions_label")}</FormLabel>
                      <div className="grid grid-cols-1 gap-2 border rounded-md p-4 max-h-[200px] overflow-y-auto">
                        {Object.entries(APIKeyPermissions).map(([key, value]) => (
                          <FormField
                            key={key}
                            control={editForm.control}
                            name="permissions"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={key}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(key)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), key])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== key
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {value.name}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="licenseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("server_label")}</FormLabel>
                      <div className="flex gap-2">
                        <Select 
                          onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                          value={field.value || "none"}
                          disabled={serversLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={t("select_server")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">{t("no_server")}</span>
                            </SelectItem>
                            {userServers.map((server: any) => (
                              <SelectItem key={server.id} value={server.id}>
                                {formatServerName(server.serverName)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.value && field.value !== "none" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => field.onChange(null)}
                            title={t("unlink_server")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? t("actions") + "..." : t("actions")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Secret Key Display Dialog */}
        <Dialog
          open={!!createdKey}
          onOpenChange={(open) => {
            if (!open) {
                setCreatedKey(null);
                setShowCreatedAccess(false);
                setShowCreatedSecret(false);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("secret_key_label")}</DialogTitle>
              <DialogDescription className="text-destructive font-medium">
                {t("secret_key_warning")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("access_key_label")}</Label>
                <div className="flex gap-2">
                  <Input readOnly value={showCreatedAccess ? createdKey?.accessKey || "" : maskString(createdKey?.accessKey || "", 10)} />
                  <Button
                        variant="ghost"
                        size="icon"
                        className="border"
                        onClick={() => setShowCreatedAccess(!showCreatedAccess)}
                    >
                        {showCreatedAccess ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        createdKey?.accessKey || "",
                        t("access_key_label")
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("secret_key_label")}</Label>
                <div className="flex gap-2">
                  <Input readOnly value={showCreatedSecret ? createdKey?.secretKey || "" : maskString(createdKey?.secretKey || "", 10)} />
                   <Button
                        variant="ghost"
                        size="icon"
                        className="border"
                        onClick={() => setShowCreatedSecret(!showCreatedSecret)}
                    >
                        {showCreatedSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        createdKey?.secretKey || "",
                        t("secret_key_label")
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => {
                  setCreatedKey(null);
                  setShowCreatedAccess(false);
                  setShowCreatedSecret(false);
              }}>{t("close")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
            open={!!deleteId}
            onOpenChange={(open) => {
                if (!open) setDeleteId(null);
            }}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t("delete_confirm_title")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("delete_confirm_description")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {t("confirm_delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </div>
    </ContentLayout>
  );
}

