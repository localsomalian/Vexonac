"use client";

import { useState } from "react";
import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import { useSession } from "@/hooks/use-session";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/utils";
import type { Permission } from "@vexonac/database";
import { useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import dynamic from "next/dynamic";
const ConsoleViewer = dynamic(
	() => import("@/components/console/console-viewer").then((m) => m.ConsoleViewer),
	{ ssr: false }
);
import { SiteHeader } from "@/components/panel-header";


export default function ServerConsole() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;
  const { data: session } = useSession();

  // Fetch server data
  const { data: server, isLoading: serverLoading } = useQuery(
    trpc.servers.getServer.queryOptions(serverId, {
      enabled: !!session?.user,
      staleTime: 30000,
    })
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
  }, [server]);

  // Check permissions
  const isOwner = server?.isOwner;
  const hasViewConsolePermission = hasPermission(server?.permissions, "VIEW_CONSOLE");
  const hasRunCommandsPermission = hasPermission(server?.permissions, "RUN_COMMANDS");
  const canViewConsole = isOwner || hasViewConsolePermission;
  const canRunCommands = isOwner || hasRunCommandsPermission;

  // Loading state
  if (serverLoading) {
    return (
      <ContentLayout
        title="Loading..."
        breadcrumb={{ title: "Dashboard", url: `/dashboard/server/${serverId}` }}
      >
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ContentLayout>
    );
  }

  // Access denied states
  if (!isAllowed) {
    return (
      <ContentLayout
        title={formatServerName(server?.serverName || "Logs Dashboard")}
        breadcrumb={{ title: "Dashboard", url: `/dashboard/server/${serverId}` }}
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

  if (!canViewConsole) {
    return (
      <ContentLayout
        title={formatServerName(server?.serverName || "Logs Dashboard")}
        breadcrumb={{ title: "Dashboard", url: `/dashboard/server/${serverId}` }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to view console. Contact the server owner to get the VIEW_CONSOLE permission.
            </CardDescription>
          </CardHeader>
        </Card>
      </ContentLayout>
    );
  }

  // For console, we need a full-height layout that bypasses ContentLayout's constraints
  return (
    <div className="flex flex-col h-screen">
      <SiteHeader
        title={formatServerName(server?.serverName || "Server Console")}
        breadcrumb={{ title: "Dashboard", url: `/dashboard/server/${serverId}` }}
      />
      <div className="flex-1 p-4 overflow-hidden">
        <ConsoleViewer 
          serverId={serverId}
          canRunCommands={canRunCommands}
        />
      </div>
    </div>
  );
}
