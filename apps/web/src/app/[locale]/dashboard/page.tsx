"use client";

import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useQuery, useQueries } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  MessageSquare,
  MoveDownRight,
  MoveUpRight,
  Server,
  Shield,
  ShieldAlert,
  Skull,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  Wifi,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// ─── Micro stat card ────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  sub,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: { value: number; isPositive: boolean; label: string };
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-5 flex flex-col gap-4 backdrop-blur-sm hover:border-white/[0.1] transition-all duration-300">
      <div className="flex items-start justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shadow-lg", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-9 w-24" />
      ) : (
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      )}
      <div className="flex items-center gap-2">
        {trend && !loading && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              trend.isPositive
                ? "text-emerald-400 bg-emerald-400/10"
                : "text-red-400 bg-red-400/10"
            )}
          >
            {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.label}
          </span>
        )}
        {sub && (
          <span className="text-xs text-muted-foreground/60">{sub}</span>
        )}
      </div>
    </div>
  );
}

// ─── Server row ─────────────────────────────────────────────────────────────
function ServerRow({ server }: { server: any }) {
  const playerPct = server.serverInfo.maxSlots
    ? Math.round((server.serverInfo.playerCount / server.serverInfo.maxSlots) * 100)
    : 0;

  return (
    <Link
      href={`/dashboard/server/${server.id}`}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative shrink-0">
          <div
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold",
              server.serverInfo.isOnline
                ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-400"
                : "bg-white/[0.05] text-muted-foreground/40"
            )}
          >
            {(server.serverName?.replace(/\^[0-9]/g, "") || "?").charAt(0).toUpperCase()}
          </div>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
              server.serverInfo.isOnline ? "bg-emerald-400" : "bg-muted-foreground/30"
            )}
          />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{formatServerName(server.serverName)}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {server.serverInfo.playerCount ?? 0}
              {server.serverInfo.maxSlots ? `/${server.serverInfo.maxSlots}` : ""} players
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {server.serverInfo.banCount ?? 0} bans
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {server.serverInfo.isOnline && server.serverInfo.maxSlots && (
          <div className="hidden sm:flex flex-col items-end gap-1 w-20">
            <span className="text-[10px] text-muted-foreground">{playerPct}% full</span>
            <div className="w-full h-1 rounded-full bg-white/[0.06]">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  playerPct > 80 ? "bg-orange-400" : playerPct > 50 ? "bg-blue-400" : "bg-emerald-400"
                )}
                style={{ width: `${playerPct}%` }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          Manage <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}

// ─── Activity item ───────────────────────────────────────────────────────────
const ACT_ICON: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ban:   { icon: Shield, color: "text-red-400", bg: "bg-red-500/10" },
  notice: { icon: Bell, color: "text-blue-400", bg: "bg-blue-500/10" },
  detection: { icon: ShieldAlert, color: "text-amber-400", bg: "bg-amber-500/10" },
};

function ActivityItem({ item }: { item: any }) {
  const { icon: Icon, color, bg } = ACT_ICON[item.type] ?? ACT_ICON.detection;
  return (
    <div className="flex gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", bg)}>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-snug">
          {item.type === "notice" ? (
            <span className="font-medium text-blue-400">{item.player}</span>
          ) : (
            <>
              <span className="font-semibold text-foreground">{item.player}</span>
              <span className="text-muted-foreground"> {item.type === "ban" ? "was banned on" : "flagged on"} </span>
              <span className="text-muted-foreground/70">{item.server}</span>
            </>
          )}
        </p>
        <p className="text-[11px] text-muted-foreground/50 mt-0.5 truncate">
          {item.reason || "No reason"} ·{" "}
          {formatDistanceToNow(item.timestamp, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const t = useScopedI18n("dashboard");
  const { data: session } = authClient.useSession();

  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const latestVersion = useQuery(trpc.versions.getLatestVersion.queryOptions(undefined, { staleTime: 60000 })) as any;
  const { data: vexonacStats, isLoading: isLoadingStats } = useQuery(trpc.stats.getGlobalStats.queryOptions(undefined, { staleTime: 60000 }));
  const { data: userServers, isLoading: isLoadingServers } = useQuery(trpc.users.getUserServersList.queryOptions("all", { staleTime: 30000 }));
  const { data: statusData } = useQuery(trpc.status.getPublic.queryOptions(undefined, { staleTime: 60000 }));

  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [dateStr, setDateStr] = useState<string>("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("vx_dismissed_notices") || "[]");
      if (stored.length > 0) setDismissedIds(stored);
    } catch {}
    setDateStr(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  }, []);

  const dismissNotice = (id: string) => {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    try { localStorage.setItem("vx_dismissed_notices", JSON.stringify(next)); } catch {}
  };

  const serverList = (userServers as any[]) ?? [];
  const serverIds = serverList.map((s: any) => s.id);

  const banQueries = useQueries({
    queries: serverIds.map((serverId: string) =>
      trpc.servers.getBans.queryOptions(
        { serverId, page: 1, limit: 5, sortBy: "bannedAt", sortOrder: "desc" },
        { staleTime: 30000, enabled: serverIds.length > 0 }
      )
    ),
  });

  const isLoadingActivities = isLoadingServers || banQueries.some((q: any) => q.isLoading);

  const banActivities = (banQueries as any[]).flatMap((q: any, i: number) =>
    ((q.data as any)?.bans ?? []).map((ban: any) => ({
      id: ban.id,
      type: "ban",
      server: serverList[i]?.serverName ?? "Server",
      serverId: serverIds[i],
      player: ban.player?.playerName ?? "Unknown",
      reason: ban.reason ?? "",
      timestamp: new Date(ban.bannedAt),
    }))
  );

  const noticeActivities = ((statusData?.activeIncidents ?? []) as any[]).map((inc: any) => ({
    id: `notice-${inc.id}`,
    type: "notice",
    server: "VexonAC Status",
    serverId: "",
    player: inc.title,
    reason: inc.updates?.[0]?.message ?? inc.status,
    timestamp: new Date(inc.createdAt),
  }));

  const recentActivities = [...noticeActivities, ...banActivities]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 12);

  const activeNotices = ((statusData?.activeIncidents ?? []) as any[]).filter(
    (inc: any) => !dismissedIds.includes(inc.id)
  );

  const username = session?.user?.name || "Operator";
  const isOnline = !healthCheck.isLoading && !!healthCheck.data;

  const onlineServers = serverList.filter((s: any) => s.serverInfo.isOnline).length;
  const totalPlayers = serverList.reduce((sum: number, s: any) => sum + (s.serverInfo.playerCount || 0), 0);
  const totalBans = serverList.reduce((sum: number, s: any) => sum + (s.serverInfo.banCount || 0), 0);

  const impactConfig: Record<string, { border: string; icon: string; text: string }> = {
    critical: { border: "border-red-500/30 bg-red-500/5", icon: "text-red-400", text: "text-red-300" },
    major:    { border: "border-orange-500/30 bg-orange-500/5", icon: "text-orange-400", text: "text-orange-300" },
    minor:    { border: "border-yellow-500/30 bg-yellow-500/5", icon: "text-yellow-400", text: "text-yellow-300" },
    none:     { border: "border-blue-500/30 bg-blue-500/5", icon: "text-blue-400", text: "text-blue-300" },
  };

  return (
    <ContentLayout title={t("title")}>
      {/* ── Welcome header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              {username}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5" suppressHydrationWarning>
            {dateStr}
            {dateStr ? " · " : ""}VexonAC Control Center
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border font-medium",
              isOnline
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-border/40 bg-card text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isOnline ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40"
              )}
            />
            {isOnline ? "All systems operational" : "Checking status…"}
          </div>
          <Link href="/dashboard/download">
            <Button variant="outline" size="sm" className="gap-2 text-xs">
              <Download className="h-3.5 w-3.5" />
              Download AC
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Active status notices ── */}
      {activeNotices.length > 0 && (
        <div className="flex flex-col gap-2">
          {activeNotices.map((inc: any) => {
            const cfg = impactConfig[inc.impact] ?? impactConfig.none;
            return (
              <div key={inc.id} className={cn("rounded-xl border p-4 flex items-start gap-3", cfg.border)}>
                <AlertTriangle className={cn("h-4 w-4 shrink-0 mt-0.5", cfg.icon)} />
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold", cfg.text)}>{inc.title}</p>
                  {inc.updates?.[0] && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{inc.updates[0].message}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground/60 mt-1 capitalize">
                    {inc.status} · {formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <button
                  onClick={() => dismissNotice(inc.id)}
                  className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground shrink-0 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Global stat tiles ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="AC Version"
          value={latestVersion.data ? `v${latestVersion.data.version}` : "—"}
          icon={Shield}
          iconColor="text-blue-400"
          iconBg="bg-gradient-to-br from-blue-500/20 to-blue-600/10"
          sub={latestVersion.data?.updatedAt ? `Released ${formatDistanceToNow(latestVersion.data.updatedAt, { addSuffix: true })}` : undefined}
          loading={latestVersion.isLoading}
        />
        <StatCard
          label="Servers Online"
          value={(vexonacStats?.current?.onlineServers ?? 0).toLocaleString()}
          icon={Server}
          iconColor="text-violet-400"
          iconBg="bg-gradient-to-br from-violet-500/20 to-violet-600/10"
          trend={
            vexonacStats?.trends?.servers
              ? {
                  value: vexonacStats.trends.servers.absoluteChange,
                  isPositive: vexonacStats.trends.servers.isPositive,
                  label: `${Math.abs(vexonacStats.trends.servers.absoluteChange)} today`,
                }
              : undefined
          }
          loading={isLoadingStats}
        />
        <StatCard
          label="Players Online"
          value={(vexonacStats?.current?.onlinePlayers ?? 0).toLocaleString()}
          icon={Users}
          iconColor="text-sky-400"
          iconBg="bg-gradient-to-br from-sky-500/20 to-sky-600/10"
          trend={
            vexonacStats?.trends?.players
              ? {
                  value: vexonacStats.trends.players.absoluteChange,
                  isPositive: vexonacStats.trends.players.isPositive,
                  label: `${vexonacStats.trends.players.absoluteChange.toLocaleString()} today`,
                }
              : undefined
          }
          loading={isLoadingStats}
        />
        <StatCard
          label="System Status"
          value={isOnline ? "Online" : "Offline"}
          icon={isOnline ? CheckCircle2 : XCircle}
          iconColor={isOnline ? "text-emerald-400" : "text-red-400"}
          iconBg={isOnline ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10" : "bg-gradient-to-br from-red-500/20 to-red-600/10"}
          sub="99.8% uptime this month"
          loading={healthCheck.isLoading}
        />
      </div>

      {/* ── Your server stats ── */}
      {serverList.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Wifi className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{onlineServers}<span className="text-sm text-muted-foreground font-normal">/{serverList.length}</span></p>
              <p className="text-xs text-muted-foreground">Your servers online</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPlayers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Players across your servers</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Skull className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalBans.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total bans across servers</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Servers list */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-white/[0.05] flex items-center justify-center">
                <Server className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm font-semibold">{t("my_servers")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{onlineServers}/{serverList.length} online</span>
              <Link href="/dashboard/redeem">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Add server <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="divide-y divide-white/[0.03]">
            {isLoadingServers ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : serverList.length > 0 ? (
              serverList.map((server: any) => <ServerRow key={server.id} server={server} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-2xl border border-dashed border-white/[0.1] flex items-center justify-center mb-4">
                  <Server className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-semibold text-foreground/60">{t("no_servers_found")}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-5">{t("no_servers_description")}</p>
                <Link href="/dashboard/redeem">
                  <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-500">
                    {t("add_server")} <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden flex flex-col">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.05]">
            <div className="h-7 w-7 rounded-lg bg-white/[0.05] flex items-center justify-center">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold">{t("recent_activity")}</span>
          </div>

          <div className="flex-1 divide-y divide-white/[0.03] overflow-y-auto max-h-[420px]">
            {isLoadingActivities ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 px-5 py-3">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))
            ) : recentActivities.length > 0 ? (
              recentActivities.map((item: any) => <ActivityItem key={item.id} item={item} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Activity className="h-6 w-6 text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground/50">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Download AC", desc: "Get latest resource", icon: Download, href: "/dashboard/download", color: "text-blue-400", bg: "bg-blue-500/10 hover:bg-blue-500/15" },
            { label: "Global Bans", desc: "Cross-server registry", icon: Shield, href: "/dashboard/global-bans", color: "text-red-400", bg: "bg-red-500/10 hover:bg-red-500/15" },
            { label: "Configurations", desc: "Community configs", icon: Star, href: "/dashboard/configurations", color: "text-amber-400", bg: "bg-amber-500/10 hover:bg-amber-500/15" },
            { label: "API Keys", desc: "Manage integrations", icon: Zap, href: "/dashboard/api-keys", color: "text-violet-400", bg: "bg-violet-500/10 hover:bg-violet-500/15" },
          ].map(({ label, desc, icon: Icon, href, color, bg }) => (
            <Link key={label} href={href}>
              <div className={cn("rounded-xl border border-white/[0.06] p-4 flex items-center gap-3 transition-all cursor-pointer group", bg)}>
                <div className="h-9 w-9 rounded-lg bg-white/[0.05] group-hover:bg-white/[0.08] flex items-center justify-center shrink-0 transition-colors">
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ContentLayout>
  );
}
