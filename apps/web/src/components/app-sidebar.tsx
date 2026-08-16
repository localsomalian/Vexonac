"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  BookOpen,
  Code,
  Download,
  Drama,
  FileText,
  Gift,
  Key,
  LayoutDashboard,
  LifeBuoy,
  Map,
  MessageSquare,
  Rocket,
  ScreenShare,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldUser,
  Terminal,
  Users,
} from "lucide-react";
import * as React from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "@/hooks/use-session";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import Image from "next/image";
import Link from "next/link";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavServers } from "./nav-servers";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const t = useScopedI18n("sidebar");
  const pathname = usePathname();

  // Always call useQuery but control execution with enabled option
  const { data: servers, error: serversError } = useQuery(
    trpc.users.getUserServersList.queryOptions("all", {
      enabled: !!session?.user && session.user.id !== "demo-user-123456789", // Don't fetch for demo user
      staleTime: 30000, // Consider data stale after 30 seconds
    })
  );

  const { data: isAdmin } = useQuery(trpc.adminAuth.isAdmin.queryOptions());

  // Log errors if any
  useEffect(() => {
    if (serversError) {
      console.error("Failed to fetch servers:", serversError);
    }
  }, [serversError]);

  const data = {
    user: {
      username: (session as any)?.user?.username || "",
      discordId: (session as any)?.user?.discordId || "",
      avatar: session?.user?.image || "",
    },
    // Use fetched servers data or empty array if loading or error
    servers: servers || [],
    navMain: [
      { title: t("dashboard"), url: "/dashboard", icon: LayoutDashboard },
      { title: t("redeem"), url: "/dashboard/redeem", icon: Gift },
      { title: t("download"), url: "/dashboard/download", icon: Download },
      {
        title: t("configuration_library"),
        url: "/dashboard/configurations",
        icon: Search,
      },
      {
        title: t("models"),
        url: "/dashboard/models",
        icon: Drama,
      },
      {
        title: "Incidents",
        url: "/dashboard/incidents",
        icon: AlertTriangle,
      },
      {
        title: "Global Bans",
        url: "/dashboard/global-bans",
        icon: Ban,
      },
      ...(isAdmin
        ? [
            { title: "Admin", url: "/dashboard/admin", icon: ShieldUser },
            { title: "Global Bans (Admin)", url: "/dashboard/admin/global-bans", icon: ShieldUser },
          ]
        : []),
      // {
      //   title: "API Keys",
      //   url: "/dashboard/api-keys",
      //   icon: Key,
      // },
    ],
    navSecondary: [
      {
        title: t("support"),
        url: "https://discord.gg/NrzrubrYad",
        icon: LifeBuoy,
      },
      {
        title: t("documentation"),
        url: "https://docs.vexonac.com",
        icon: BookOpen,
      },
      // {
      //   title: "API Docs",
      //   url: "/api-docs",
      //   icon: Code,
      // },
    ],
  };

  // Check if we're on demo pages
  const isOnDemoPages = pathname?.includes('/server/demo');

  // Add demo server only when on demo pages
  const serversWithDemo = isOnDemoPages ? [
    {
      id: "demo",
      serverName: "Demo Server",
      bannerUrl: null,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      serverInfo: {
        isOnline: true,
        version: "1.2.3",
        playerCount: 256,
        banCount: 15,
        lastActiveAt: new Date(),
        maxSlots: 300,
      },
      isOwner: true,
      isMember: false,
      permissions: [],
    },
    ...(servers || [])
  ] : (servers || []);

  // Transform servers data for NavServers component
  const navServers = serversWithDemo.map((server) => ({
    serverId: server.id,
    serverName: server.serverName,
    isOnline: (server as any).isOnline ?? false,
    icon: Server,
    items: [
      {
        title: t("dashboard"),
        url: `/dashboard/server/${server.id}`,
        icon: LayoutDashboard,
        visible: true,
      },
      {
        title: t("players"),
        url: `/dashboard/server/${server.id}/players`,
        icon: Users,
        visible: true,
      },
      {
        title: t("map"),
        url: `/dashboard/server/${server.id}/map`,
        icon: Map,
        visible: true,
      },
      {
        title: t("multistream"),
        url: `/dashboard/server/${server.id}/multistream`,
        icon: ScreenShare,
        visible: true,
      },
      {
        title: t("bans"),
        url: `/dashboard/server/${server.id}/bans`,
        icon: Ban,
        visible: true,
      },
      {
        title: "Whitelist",
        url: `/dashboard/server/${server.id}/whitelist`,
        icon: Shield,
        visible: true,
      },
      {
        title: t("configuration"),
        url: `/dashboard/server/${server.id}/configuration`,
        icon: Settings,
        visible: true,
      },
      {
        title: t("lookup"),
        url: `/dashboard/server/${server.id}/lookup`,
        icon: Search,
        visible: true,
      },
      {
        title: t("admins"),
        url: `/dashboard/server/${server.id}/admins`,
        icon: ShieldUser,
        visible: true,
      },
      {
        title: t("logs"),
        url: `/dashboard/server/${server.id}/logs`,
        icon: FileText,
        visible: true,
      },
      {
        title: "Detections",
        url: `/dashboard/server/${server.id}/detections`,
        icon: ShieldAlert,
        visible: true,
      },
      {
        title: "Staff Chat",
        url: `/dashboard/server/${server.id}/chat`,
        icon: MessageSquare,
        visible: true,
      },
      {
        title: t("console"),
        url: `/dashboard/server/${server.id}/console`,
        icon: Terminal,
        visible: true,
      },
      {
        title: "Setup Guide",
        url: `/dashboard/server/${server.id}/setup`,
        icon: Rocket,
        visible: true,
      },
    ],
  }));

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                  <Image
                    src="/logo.png"
                    alt="VexonAC"
                    width={20}
                    height={20}
                    className="rounded"
                  />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="truncate text-sm font-bold text-foreground">
                    VexonAC
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t("customer_area")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="mt-2 gap-0">
        <NavMain items={data.navMain} />
        <NavServers items={navServers} />
        <NavSecondary items={data.navSecondary} className="mt-auto border-t border-border/40 pt-2" />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/40 py-2">
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

