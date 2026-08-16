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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/use-session";
import { hasPermission } from "@/lib/utils";
import { useScopedI18n } from "@/locales/client";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Permission } from "@vexonac/database";
import { format, formatDistanceToNow } from "date-fns";
import {
	BarChart3,
	Calendar,
	Check,
	Copy,
	Eye,
	EyeOff,
	FileWarning,
	Key,
	Network,
	Pencil,
	RotateCcw,
	Shield,
	ShieldAlert,
	ShieldCheck,
	Trash2,
	Users,
	Ban,
	X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ServerDashboard() {
	const t = useScopedI18n("server_dashboard");
	const params = useParams();
	const router = useRouter();
	const serverId = params.serverId as string;
	const { data: session } = useSession();
	const [showLicenseKey, setShowLicenseKey] = useState(false);
	const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");
	const [editingName, setEditingName] = useState(false);
	const [nameInput, setNameInput] = useState("");

	const { data: server, isLoading } = useQuery(
		trpc.servers.getServer.queryOptions(serverId, {
			enabled: !!session?.user,
			staleTime: 10000,
			refetchInterval: 10000,
		})
	);

	const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery(
		trpc.servers.getServerAnalytics.queryOptions(
			{ serverId, timeRange },
			{ enabled: !!session?.user && !!server, staleTime: 30000, refetchInterval: 30000 }
		)
	);

	const { data: latestVersion } = useQuery({
		...trpc.versions.getLatestVersion.queryOptions(),
		enabled: !!session?.user,
		staleTime: 60000,
	});

	const isAllowed = useMemo(() => {
		if (!server) return false;
		if (server.isOwner) return true;
		if (server.permissions && Array.isArray(server.permissions)) {
			return hasPermission(server.permissions.map((p) => String(p)) as Permission[], "ANY");
		}
		return false;
	}, [server]);

	const serverInfo = {
		version: server?.serverInfo.version || "0.0.0",
		isOnline: server?.serverInfo.isOnline || false,
		playerCount: server?.serverInfo.playerCount || 0,
		banCount: server?.serverInfo.banCount || 0,
		maxSlots: server?.serverInfo.maxSlots || 0,
		peakPlayers: analyticsData?.peakPlayers || 0,
		avgPlayers: analyticsData?.avgPlayers || 0,
	};

	const isVersionOutdated = latestVersion && serverInfo.version && serverInfo.version !== latestVersion.version;

	const copyLicenseKey = () => {
		if (server?.licenseKey) {
			navigator.clipboard.writeText(server.licenseKey);
			toast.success(t("license_key_copied"));
		}
	};

	const expirationInfo = (() => {
		if (!server?.expiresAt) return null;
		const exp = new Date(server.expiresAt);
		const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000);
		return {
			formatted: format(exp, "PPP"),
			fromNow: formatDistanceToNow(exp, { addSuffix: true }),
			isImminent: daysLeft <= 14,
			isExpired: daysLeft <= 0,
			daysLeft,
		};
	})();

	const queryClient = useQueryClient();
	const canResetIp = server?.isOwner;
	const canViewLicenseKey = server?.isOwner;
	const canDelete = server?.isOwner;
	const canRenew = server?.isOwner && expirationInfo?.isImminent;

	const resetIp = useMutation(
		trpc.servers.resetIp.mutationOptions({
			onSuccess: () => {
				toast.success(t("ip_reset_success"));
				queryClient.invalidateQueries({ queryKey: [["servers", "getServer"], { input: serverId }] });
			},
			onError: (error) => toast.error(t("ip_reset_error"), { description: error.message }),
		})
	);

	const deleteServer = useMutation(
		trpc.servers.deleteServer.mutationOptions({
			onSuccess: () => {
				toast.success(t("server_deleted"));
				queryClient.invalidateQueries({ queryKey: [["users", "getUserServersList"]] });
				router.push("/dashboard");
			},
			onError: () => toast.error(t("server_delete_error")),
		})
	);

	const renameServer = useMutation(
		trpc.servers.renameServer.mutationOptions({
			onSuccess: () => {
				toast.success("Server renamed");
				setEditingName(false);
				queryClient.invalidateQueries({ queryKey: [["servers", "getServer"], { input: serverId }] });
				queryClient.invalidateQueries({ queryKey: [["users", "getUserServersList"]] });
			},
			onError: (e) => toast.error(e.message),
		})
	);

	if (isLoading) {
		return (
			<ContentLayout title={t("server_dashboard")} breadcrumb={{ title: t("dashboard"), url: "/dashboard" }}>
				<div className="grid gap-4">
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
						{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
					</div>
					<Skeleton className="h-80 rounded-xl" />
				</div>
			</ContentLayout>
		);
	}

	if (!isAllowed) {
		return (
			<ContentLayout title={t("server_dashboard")} breadcrumb={{ title: t("dashboard"), url: "/dashboard" }}>
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<div className="h-14 w-14 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
						<ShieldAlert className="h-7 w-7 text-red-400" />
					</div>
					<h2 className="text-lg font-semibold mb-1">Access Denied</h2>
					<p className="text-sm text-muted-foreground max-w-sm">
						You don't have permission to access this server. Contact the owner to be added.
					</p>
				</div>
			</ContentLayout>
		);
	}

	if (!server) {
		return (
			<ContentLayout title={t("server_dashboard")} breadcrumb={{ title: t("dashboard"), url: "/dashboard" }}>
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<div className="h-14 w-14 rounded-xl border border-dashed border-border/50 flex items-center justify-center mb-4">
						<FileWarning className="h-7 w-7 text-muted-foreground/40" />
					</div>
					<h3 className="text-lg font-semibold mb-1">{t("server_not_found")}</h3>
					<p className="text-sm text-muted-foreground mb-5">{t("server_not_found_description")}</p>
					<Link href="/dashboard" className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
						{t("return_to_dashboard")}
					</Link>
				</div>
			</ContentLayout>
		);
	}

	return (
		<ContentLayout
			title={formatServerName(server.serverName)}
			breadcrumb={{ title: t("dashboard"), url: "/dashboard" }}
		>
			{/* Server header */}
			<div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card">
				{/* Subtle grid background */}
				<div
					className="absolute inset-0 opacity-[0.03]"
					style={{
						backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
						backgroundSize: "40px 40px",
					}}
				/>
				{/* Glow accent */}
				<div className={cn(
					"absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-10",
					serverInfo.isOnline ? "bg-blue-500" : "bg-red-500"
				)} />

				<div className="relative p-6 flex flex-col sm:flex-row sm:items-center gap-6">
					{/* Icon */}
					<div className={cn(
						"h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border",
						serverInfo.isOnline
							? "bg-blue-500/10 border-blue-500/20"
							: "bg-red-500/10 border-red-500/20"
					)}>
						<Shield className={cn("h-7 w-7", serverInfo.isOnline ? "text-blue-400" : "text-red-400")} />
					</div>

					{/* Name + meta */}
					<div className="flex-1 min-w-0">
						<div className="flex flex-wrap items-center gap-2 mb-1">
							{editingName ? (
								<div className="flex items-center gap-2">
									<input
										autoFocus
										value={nameInput}
										onChange={(e) => setNameInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && nameInput.trim()) renameServer.mutate({ serverId, serverName: nameInput.trim() });
											if (e.key === "Escape") setEditingName(false);
										}}
										className="text-xl font-bold bg-background/50 border border-border/60 rounded-lg px-2 py-0.5 focus:outline-none focus:border-blue-500/60 w-64"
									/>
									<button onClick={() => { if (nameInput.trim()) renameServer.mutate({ serverId, serverName: nameInput.trim() }); }}
										disabled={renameServer.isPending}
										className="h-7 w-7 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 flex items-center justify-center transition-colors">
										<Check className="h-3.5 w-3.5" />
									</button>
									<button onClick={() => setEditingName(false)}
										className="h-7 w-7 rounded-lg bg-border/20 border border-border/40 text-muted-foreground hover:bg-white/5 flex items-center justify-center transition-colors">
										<X className="h-3.5 w-3.5" />
									</button>
								</div>
							) : (
								<div className="flex items-center gap-2 group/name">
									<h1 className="text-xl font-bold truncate">{formatServerName(server.serverName)}</h1>
									{server.isOwner && (
										<button onClick={() => { setNameInput(server.serverName ?? ""); setEditingName(true); }}
											className="h-6 w-6 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5 flex items-center justify-center opacity-0 group-hover/name:opacity-100 transition-all">
											<Pencil className="h-3 w-3" />
										</button>
									)}
								</div>
							)}
							<span className={cn(
								"inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
								server.isBanned
									? "bg-red-500/10 border-red-500/30 text-red-400"
									: serverInfo.isOnline
										? "bg-green-500/10 border-green-500/30 text-green-400"
										: "bg-zinc-500/10 border-zinc-500/30 text-zinc-400"
							)}>
								<span className={cn(
									"h-1.5 w-1.5 rounded-full",
									server.isBanned ? "bg-red-400" : serverInfo.isOnline ? "bg-green-400 animate-pulse" : "bg-zinc-400"
								)} />
								{server.isBanned ? "Banned" : serverInfo.isOnline ? t("online") : t("offline")}
							</span>
							{isVersionOutdated && (
								<span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
									{t("update_to_version", { version: latestVersion?.version })}
								</span>
							)}
						</div>
						<p className="text-xs text-muted-foreground">
							v{serverInfo.version}
							{expirationInfo && (
								<>
									<span className="mx-1.5 opacity-30">·</span>
									<span className={cn(expirationInfo.isExpired ? "text-red-400" : expirationInfo.isImminent ? "text-amber-400" : "")}>
										{expirationInfo.isExpired ? t("expired") : `${t("license_expiration")}: ${expirationInfo.daysLeft} ${t("days")}`}
									</span>
								</>
							)}
						</p>
					</div>

					{/* Actions */}
					<div className="flex flex-wrap items-center gap-2 shrink-0">
						{canRenew && (
							<Link href={`/dashboard/redeem?serverId=${serverId}`} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
								<ShieldCheck className="h-3.5 w-3.5" />{t("renew_license")}
							</Link>
						)}
						{canDelete && expirationInfo?.isExpired && (
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<button className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
										<Trash2 className="h-3.5 w-3.5" />{t("delete_server")}
									</button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>{t("delete_server")}</AlertDialogTitle>
										<AlertDialogDescription>{t("delete_server_confirmation")}</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
										<AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteServer.mutate(serverId)}>
											{t("delete_server")}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
				</div>
			</div>

			{/* Stats grid */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
				{/* Players */}
				<div className="rounded-xl border border-border/50 bg-card p-5 flex flex-col gap-3 group hover:border-blue-500/30 transition-colors">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground font-medium">{t("current_players")}</span>
						<div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
							<Users className="h-3.5 w-3.5 text-blue-400" />
						</div>
					</div>
					<div>
						<span className="text-2xl font-bold tabular-nums">{serverInfo.playerCount}</span>
						<span className="text-sm text-muted-foreground font-medium"> / {serverInfo.maxSlots}</span>
					</div>
					<div className="h-1 rounded-full bg-border/50 overflow-hidden">
						<div
							className="h-full rounded-full bg-blue-500 transition-all"
							style={{ width: serverInfo.maxSlots > 0 ? `${Math.min(100, (serverInfo.playerCount / serverInfo.maxSlots) * 100)}%` : "0%" }}
						/>
					</div>
				</div>

				{/* Bans */}
				<div className="rounded-xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-red-500/30 transition-colors">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground font-medium">{t("banned_players")}</span>
						<div className="h-7 w-7 rounded-lg bg-red-500/10 flex items-center justify-center">
							<Ban className="h-3.5 w-3.5 text-red-400" />
						</div>
					</div>
					<span className="text-2xl font-bold tabular-nums">{serverInfo.banCount}</span>
					<p className="text-xs text-muted-foreground">{t("peak_players")}: {isAnalyticsLoading ? "—" : serverInfo.peakPlayers}</p>
				</div>

				{/* IP */}
				<div className="rounded-xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-violet-500/30 transition-colors">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground font-medium">{t("server_ip")}</span>
						<div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
							<Network className="h-3.5 w-3.5 text-violet-400" />
						</div>
					</div>
					{canResetIp ? (
						<>
							<span className="text-sm font-semibold font-mono truncate">{server.serverIp || t("not_set")}</span>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit">
										<RotateCcw className="h-3 w-3" /> {t("reset_ip")}
									</button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>{t("reset_server_ip")}</AlertDialogTitle>
										<AlertDialogDescription>{t("reset_ip_confirmation")}</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
										<AlertDialogAction onClick={() => resetIp.mutate(serverId)}>{t("reset_ip")}</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</>
					) : (
						<>
							<span className="text-sm font-semibold blur-sm select-none">xxx.xxx.xxx</span>
							<p className="text-xs text-muted-foreground">{t("restricted_access")}</p>
						</>
					)}
				</div>

				{/* License key */}
				<div className="rounded-xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:border-purple-500/30 transition-colors">
					<div className="flex items-center justify-between">
						<span className="text-xs text-muted-foreground font-medium">{t("license_key")}</span>
						<div className="h-7 w-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
							<Key className="h-3.5 w-3.5 text-purple-400" />
						</div>
					</div>
					{canViewLicenseKey ? (
						<>
							<span className="text-xs font-mono truncate text-foreground/80 flex-1">
								{showLicenseKey ? server.licenseKey : server.licenseKey?.replace(/./g, "•")}
							</span>
							<div className="flex gap-3">
								<button
									onClick={() => setShowLicenseKey(!showLicenseKey)}
									className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
								>
									{showLicenseKey ? <><EyeOff className="h-3 w-3" />{t("hide")}</> : <><Eye className="h-3 w-3" />{t("show")}</>}
								</button>
								<button
									onClick={copyLicenseKey}
									className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
								>
									<Copy className="h-3 w-3" />{t("copy")}
								</button>
							</div>
						</>
					) : (
						<>
							<span className="text-xs font-mono blur-sm select-none">••••••••••••••••</span>
							<p className="text-xs text-muted-foreground">{t("restricted_access")}</p>
						</>
					)}
				</div>
			</div>

			{/* Analytics chart */}
			<div className="rounded-xl border border-border/50 bg-card p-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
					<div>
						<h3 className="text-sm font-semibold">{t("server_analytics")}</h3>
						<p className="text-xs text-muted-foreground mt-0.5">{t("server_analytics_description")}</p>
					</div>
					<Tabs defaultValue="today" onValueChange={(v) => setTimeRange(v as "today" | "week" | "month")}>
						<TabsList className="bg-background/50 border border-border/40">
							<TabsTrigger value="today" className="text-xs">{t("today")}</TabsTrigger>
							<TabsTrigger value="week" className="text-xs">{t("last_7_days")}</TabsTrigger>
							<TabsTrigger value="month" className="text-xs">{t("last_30_days")}</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				{/* Summary numbers */}
				<div className="grid grid-cols-2 gap-3 mb-6">
					<div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-4">
						<p className="text-xs text-muted-foreground mb-1">{t("peak_players")}</p>
						<p className="text-2xl font-bold text-blue-400 tabular-nums">
							{isAnalyticsLoading ? <span className="text-muted-foreground/40">—</span> : serverInfo.peakPlayers}
						</p>
					</div>
					<div className="rounded-lg bg-violet-500/5 border border-violet-500/10 p-4">
						<p className="text-xs text-muted-foreground mb-1">{t("average_players")}</p>
						<p className="text-2xl font-bold text-violet-400 tabular-nums">
							{isAnalyticsLoading ? <span className="text-muted-foreground/40">—</span> : serverInfo.avgPlayers}
						</p>
					</div>
				</div>

				<ChartContainer
					className="aspect-auto h-[220px] w-full"
					config={{
						players: { label: t("players"), color: "#3b82f6" },
						bans: { label: t("bans"), color: "#ef4444" },
					}}
				>
					{!analyticsData?.chartData || analyticsData.chartData.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full text-center">
							<BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
							<p className="text-sm text-muted-foreground">
								{isAnalyticsLoading ? "Loading analytics…" : "No analytics data yet"}
							</p>
						</div>
					) : (
						<AreaChart data={analyticsData.chartData} margin={{ left: -30 }}>
							<defs>
								<linearGradient id="gPlayers" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
								</linearGradient>
								<linearGradient id="gBans" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/30" />
							<XAxis
								dataKey="date"
								tickLine={false} axisLine={false} tickMargin={8} minTickGap={32}
								tickFormatter={(v) => {
									try { return format(new Date(v), timeRange === "today" ? "HH:mm" : "MMM dd"); } catch { return v; }
								}}
							/>
							<YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
							<ChartTooltip
								labelFormatter={(l) => { try { return format(new Date(l), timeRange === "today" ? "HH:mm" : "MMM dd"); } catch { return l; } }}
								content={<ChartTooltipContent />}
							/>
							<Area type="natural" dataKey="players" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gPlayers)" />
							<Area type="natural" dataKey="bans" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#gBans)" />
							<ChartLegend content={<ChartLegendContent />} />
						</AreaChart>
					)}
				</ChartContainer>
			</div>
		</ContentLayout>
	);
}
