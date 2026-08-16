"use client";

import { ContentLayout } from "@/components/content-layout";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  Ban,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  CheckCircle,
  Clock,
  Edit2,
  Megaphone,
  Gift,
  Globe,
  Key,
  Plus,
  RefreshCw,
  Search,
  Server,
  Shield,
  Tag,
  Trash2,
  Users,
  Wifi,
  WifiOff,
  X,
  Wrench,
  ZapOff,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LICENSE_TYPES = ["TRIAL", "MONTHLY", "QUARTERLY", "BIANUALLY", "YEARLY", "LIFETIME"] as const;

function StatCard({ label, value, icon: Icon, color, loading }: {
  label: string; value: number | string; icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {loading ? <div className="h-8 w-24 rounded bg-border/30 animate-pulse" /> : (
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      )}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground shrink-0">
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function InfoField({ label, value, mono, copyable }: { label: string; value: string; mono?: boolean; copyable?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className={cn("text-[12px] truncate", mono ? "font-mono text-muted-foreground" : "font-medium")}>{value}</span>
        {copyable && <CopyBtn text={value} />}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, action }: {
  icon: React.ElementType; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Pages({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void; }) {
  return (
    <div className="flex items-center justify-between pt-3 border-t border-border/30 mt-2">
      <span className="text-xs text-muted-foreground">{total} total</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1}
          className="h-7 w-7 rounded flex items-center justify-center hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs text-muted-foreground px-2">{page} / {pages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page >= pages}
          className="h-7 w-7 rounded flex items-center justify-center hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string; }) {
  return (
    <div className="relative mb-3">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-8 pl-8 pr-3 rounded-lg border border-border/50 bg-background/50 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50" />
    </div>
  );
}

const TABS = ["Users", "Servers", "Keys", "Bans", "Discounts", "Expiring", "Logs", "Status", "Admins"] as const;
type Tab = typeof TABS[number];

export default function AdminPage() {
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery(
    trpc.adminAuth.isAdmin.queryOptions()
  );

  const [activeTab, setActiveTab] = useState<Tab>("Users");
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [serverSearch, setServerSearch] = useState("");
  const [serverPage, setServerPage] = useState(1);
  const [keySearch, setKeySearch] = useState("");
  const [keyPage, setKeyPage] = useState(1);
  const [unusedKeyPage, setUnusedKeyPage] = useState(1);
  const [keyType, setKeyType] = useState<typeof LICENSE_TYPES[number]>("MONTHLY");
  const [keyCount, setKeyCount] = useState(1);
  const [keysSubTab, setKeysSubTab] = useState<"redeemed" | "unused">("redeemed");
  const [discountForm, setDiscountForm] = useState({
    code: "", description: "", discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    discountAmount: 0, discountPercentage: 0, expiresAt: "", autoApply: false,
  });
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [selectedBan, setSelectedBan] = useState<any>(null);
  const [editingServer, setEditingServer] = useState<any>(null);
  const [editServerForm, setEditServerForm] = useState({ serverName: "", expiresAt: "", isBanned: false, banReason: "" });
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [editDiscountForm, setEditDiscountForm] = useState({ code: "", description: "", discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT", discountAmount: 0, discountPercentage: 0, expiresAt: "", autoApply: false, isActive: true });
  const [editingBan, setEditingBan] = useState<any>(null);
  const [editBanForm, setEditBanForm] = useState({ reason: "", expiresAt: "" });

  // Status tab state
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [incidentUpdateMsg, setIncidentUpdateMsg] = useState("");
  const [incidentUpdateStatus, setIncidentUpdateStatus] = useState("monitoring");
  const [incidentForm, setIncidentForm] = useState({ title: "", impact: "minor", status: "investigating", message: "" });
  const [notificationForm, setNotificationForm] = useState({ title: "", severity: "minor", message: "" });
  const [maintenanceForm, setMaintenanceForm] = useState({ title: "", description: "", scheduledStart: "", scheduledEnd: "" });

  const { data: stats, isLoading: statsLoading } = useQuery(
    trpc.admin.getPlatformStats.queryOptions()
  );
  const { data: globalStats } = useQuery(
    trpc.stats.getGlobalStats.queryOptions(undefined, { staleTime: 60000 })
  );
  const chartData = (globalStats?.chartData ?? []).map((d: any) => ({
    ...d,
    time: format(new Date(d.timestamp), "HH:mm"),
  }));
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery(
    trpc.admin.getAllUsers.queryOptions({ page: userPage, limit: 20, search: userSearch || undefined })
  );
  const { data: serversData, isLoading: serversLoading, refetch: refetchServers } = useQuery(
    trpc.admin.getAllServers.queryOptions({ page: serverPage, limit: 20, search: serverSearch || undefined })
  );
  const { data: licenseKeysData, isLoading: licenseKeysLoading, refetch: refetchLicenseKeys } = useQuery(
    trpc.admin.getAllLicenseKeys.queryOptions({ page: keyPage, limit: 20, search: keySearch || undefined })
  );
  const { data: unusedKeysData, isLoading: unusedKeysLoading, refetch: refetchUnusedKeys } = useQuery(
    trpc.admin.getRedemptionKeys.queryOptions({ page: unusedKeyPage, limit: 20 })
  );
  const { data: bansData, isLoading: bansLoading } = useQuery(
    trpc.admin.getRecentGlobalBans.queryOptions({ limit: 100 })
  );
  const { data: discountsData, isLoading: discountsLoading, refetch: refetchDiscounts } = useQuery(
    trpc.admin.getDiscounts.queryOptions()
  );

  const { mutate: resetIp } = useMutation(trpc.admin.adminResetIp.mutationOptions({
    onSuccess: () => { toast.success("IP reset"); refetchServers(); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: deleteServer } = useMutation(trpc.admin.adminDeleteServer.mutationOptions({
    onSuccess: () => { toast.success("Server deleted"); refetchServers(); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: generateKeys, isPending: generatingKeys } = useMutation(trpc.admin.generateLicenseKeys.mutationOptions({
    onSuccess: (keys) => { toast.success(`Generated ${keys.length} key(s)`); refetchUnusedKeys(); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: deleteUnusedKey } = useMutation(trpc.admin.deleteRedemptionKey.mutationOptions({
    onSuccess: () => { toast.success("Key deleted"); refetchUnusedKeys(); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: createDiscount, isPending: creatingDiscount } = useMutation(trpc.admin.createDiscount.mutationOptions({
    onSuccess: () => {
      toast.success("Discount created"); refetchDiscounts();
      setDiscountForm({ code: "", description: "", discountType: "PERCENTAGE", discountAmount: 0, discountPercentage: 0, expiresAt: "", autoApply: false });
      setShowDiscountForm(false);
    },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: toggleDiscount } = useMutation(trpc.admin.toggleDiscount.mutationOptions({
    onSuccess: () => { toast.success("Updated"); refetchDiscounts(); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: deleteDiscount } = useMutation(trpc.admin.deleteDiscount.mutationOptions({
    onSuccess: () => { toast.success("Deleted"); refetchDiscounts(); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: updateServer, isPending: updatingServer } = useMutation(trpc.admin.adminUpdateServer.mutationOptions({
    onSuccess: () => { toast.success("Server updated"); refetchServers(); setEditingServer(null); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: updateBan, isPending: updatingBan } = useMutation(trpc.admin.adminUpdateBan.mutationOptions({
    onSuccess: () => { toast.success("Ban updated"); setEditingBan(null); setSelectedBan(null); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: deleteBan } = useMutation(trpc.admin.adminDeleteBan.mutationOptions({
    onSuccess: () => { toast.success("Ban removed"); setSelectedBan(null); setEditingBan(null); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: updateDiscount, isPending: updatingDiscount } = useMutation(trpc.admin.adminUpdateDiscount.mutationOptions({
    onSuccess: () => { toast.success("Discount updated"); refetchDiscounts(); setEditingDiscount(null); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: banUser, isPending: banningUser } = useMutation(trpc.admin.adminBanUser.mutationOptions({
    onSuccess: () => { toast.success("User banned"); refetchUsers(); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: unbanUser } = useMutation(trpc.admin.adminUnbanUser.mutationOptions({
    onSuccess: () => { toast.success("User unbanned"); refetchUsers(); },
    onError: (e: any) => toast.error(e.message),
  }));

  // Expiring licenses
  const { data: expiringData, isLoading: expiringLoading } = useQuery(
    trpc.admin.getExpiringLicenses.queryOptions({ days: 14 }, { enabled: activeTab === "Expiring" })
  );

  // Logs
  const { data: systemLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery(
    trpc.admin.getRecentSystemLogs.queryOptions({ limit: 100 }, { enabled: activeTab === "Logs" })
  );

  // Status mutations/queries
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery(
    trpc.status.getAll.queryOptions(undefined, { enabled: activeTab === "Status" })
  );
  const { mutate: createIncident, isPending: creatingIncident } = useMutation(trpc.status.createIncident.mutationOptions({
    onSuccess: () => { toast.success("Incident created"); refetchStatus(); setShowIncidentForm(false); setIncidentForm({ title: "", impact: "minor", status: "investigating", message: "" }); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: createNotification, isPending: creatingNotification } = useMutation(trpc.status.createIncident.mutationOptions({
    onSuccess: () => {
      toast.success("Customer notification published");
      refetchStatus();
      setShowNotificationForm(false);
      setNotificationForm({ title: "", severity: "minor", message: "" });
    },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: addIncidentUpdate, isPending: addingUpdate } = useMutation(trpc.status.addIncidentUpdate.mutationOptions({
    onSuccess: () => { toast.success("Update posted"); refetchStatus(); setIncidentUpdateMsg(""); setSelectedIncident(null); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: deleteIncident } = useMutation(trpc.status.deleteIncident.mutationOptions({
    onSuccess: () => { toast.success("Incident deleted"); refetchStatus(); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: createMaintenance, isPending: creatingMaintenance } = useMutation(trpc.status.createMaintenance.mutationOptions({
    onSuccess: () => { toast.success("Maintenance scheduled"); refetchStatus(); setShowMaintenanceForm(false); setMaintenanceForm({ title: "", description: "", scheduledStart: "", scheduledEnd: "" }); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: updateMaintenanceStatus } = useMutation(trpc.status.updateMaintenanceStatus.mutationOptions({
    onSuccess: () => { toast.success("Updated"); refetchStatus(); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: deleteMaintenance } = useMutation(trpc.status.deleteMaintenance.mutationOptions({
    onSuccess: () => { toast.success("Deleted"); refetchStatus(); },
    onError: (e: any) => toast.error(e.message),
  }));

  // Admin users tab
  const [adminUserForm, setAdminUserForm] = useState({ username: "", password: "", role: "admin" as "admin" | "superadmin" });
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [changePwId, setChangePwId] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");
  const { data: adminUsersData, isLoading: adminUsersLoading, refetch: refetchAdminUsers } = useQuery(
    trpc.adminAuth.listAdmins.queryOptions(undefined, { enabled: activeTab === "Admins" })
  );
  const { mutate: createAdminUser, isPending: creatingAdminUser } = useMutation(trpc.adminAuth.createAdmin.mutationOptions({
    onSuccess: () => { toast.success("Admin created"); refetchAdminUsers(); setShowAdminForm(false); setAdminUserForm({ username: "", password: "", role: "admin" }); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: deleteAdminUser } = useMutation(trpc.adminAuth.deleteAdmin.mutationOptions({
    onSuccess: () => { toast.success("Admin deleted"); refetchAdminUsers(); },
    onError: (e: any) => toast.error(e.message),
  }));
  const { mutate: changeAdminPw, isPending: changingPw } = useMutation(trpc.adminAuth.changePassword.mutationOptions({
    onSuccess: () => { toast.success("Password changed"); setChangePwId(null); setNewPw(""); },
    onError: (e: any) => toast.error(e.message),
  }));

  if (isAdminLoading) {
    return (
      <ContentLayout title="Admin">
        <div className="flex items-center justify-center h-64">
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </ContentLayout>
    );
  }

  if (!isAdmin) {
    return (
      <ContentLayout title="Admin">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-red-400" />
          </div>
          <p className="text-sm font-medium">Access Denied</p>
          <p className="text-xs text-muted-foreground">You don't have permission to view this page.</p>
          <a href="/admin-login" className="text-xs text-primary underline underline-offset-2 mt-1">
            Sign in as admin
          </a>
        </div>
      </ContentLayout>
    );
  }

  const users = (usersData?.users ?? []) as any[];
  const servers = (serversData?.servers ?? []) as any[];
  const licenseKeys = (licenseKeysData?.licenses ?? []) as any[];
  const unusedKeys = (unusedKeysData?.keys ?? []) as any[];
  const bans = (bansData ?? []) as any[];
  const discounts = (discountsData ?? []) as any[];

  return (
    <ContentLayout title="Admin">
      <div className="flex flex-col gap-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="bg-blue-500/10 text-blue-400" loading={statsLoading} />
          <StatCard label="Total Servers" value={stats?.totalServers ?? 0} icon={Server} color="bg-purple-500/10 text-purple-400" loading={statsLoading} />
          <StatCard label="Online Now" value={stats?.onlineServers ?? 0} icon={Activity} color="bg-green-500/10 text-green-400" loading={statsLoading} />
          <StatCard label="Total Bans" value={stats?.totalBans ?? 0} icon={Ban} color="bg-red-500/10 text-red-400" loading={statsLoading} />
          <StatCard label="Unused Keys" value={stats?.unusedKeys ?? 0} icon={Key} color="bg-amber-500/10 text-amber-400" loading={statsLoading} />
        </div>

        {/* Overview charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 24h area chart */}
          <div className="lg:col-span-2 rounded-xl border border-border/50 bg-card p-5">
            <SectionHeader icon={Activity} title="Platform Overview" subtitle="Online servers & players — last 24 hours" />
            {chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">No data yet</div>
            ) : (
              <ChartContainer
                config={{
                  onlineServers: { label: "Online Servers", color: "hsl(var(--chart-1))" },
                  onlinePlayers: { label: "Online Players", color: "hsl(var(--chart-2))" },
                }}
                className="h-[200px] w-full"
              >
                <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminFillServers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-onlineServers)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-onlineServers)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="adminFillPlayers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-onlinePlayers)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-onlinePlayers)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    interval="preserveStartEnd" />
                  <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                  <Area type="monotone" dataKey="onlineServers" fill="url(#adminFillServers)"
                    stroke="var(--color-onlineServers)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="onlinePlayers" fill="url(#adminFillPlayers)"
                    stroke="var(--color-onlinePlayers)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ChartContainer>
            )}
          </div>

          {/* Breakdown panel */}
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <SectionHeader icon={BarChart3} title="Breakdown" subtitle="Live distribution" />
            <div className="flex flex-col gap-4 mt-1">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Online Servers</span>
                  <span className="font-medium">{stats?.onlineServers ?? 0} / {stats?.totalServers ?? 0}</span>
                </div>
                <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                  <div className="h-full rounded-full bg-green-400 transition-all"
                    style={{ width: stats?.totalServers ? `${Math.round((stats.onlineServers / stats.totalServers) * 100)}%` : "0%" }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Keys Redeemed</span>
                  <span className="font-medium">{stats?.redeemedKeys ?? 0} / {((stats?.redeemedKeys ?? 0) + (stats?.unusedKeys ?? 0))}</span>
                </div>
                <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-400 transition-all"
                    style={{ width: ((stats?.redeemedKeys ?? 0) + (stats?.unusedKeys ?? 0)) > 0
                      ? `${Math.round(((stats?.redeemedKeys ?? 0) / ((stats?.redeemedKeys ?? 0) + (stats?.unusedKeys ?? 0))) * 100)}%`
                      : "0%" }} />
                </div>
              </div>
              <div className="pt-2 border-t border-border/30 flex flex-col gap-2.5">
                {[
                  { label: "Peak Servers (24h)", value: globalStats?.peaks?.onlineServers ?? 0, cls: "text-green-400" },
                  { label: "Peak Players (24h)", value: globalStats?.peaks?.onlinePlayers ?? 0, cls: "text-blue-400" },
                  { label: "Total Bans",          value: stats?.totalBans ?? 0,                  cls: "text-red-400" },
                  { label: "Total Users",         value: stats?.totalUsers ?? 0,                 cls: "text-foreground" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={cn("font-medium", row.cls)}>{row.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl border border-border/40 bg-card w-fit">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeTab === tab ? "bg-blue-500/10 text-blue-400" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}>
              {tab}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === "Users" && (
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <SectionHeader icon={Users} title="All Users" subtitle={usersData ? `${usersData.total} registered` : undefined}
              action={<button onClick={() => refetchUsers()} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground"><RefreshCw className="h-3.5 w-3.5" /></button>} />
            <SearchInput value={userSearch} onChange={(v) => { setUserSearch(v); setUserPage(1); }} placeholder="Search username or Discord ID..." />
            <div className="rounded-lg border border-border/30 overflow-hidden">
              <div className="grid grid-cols-[1fr_140px_50px_80px_90px] gap-3 px-3 py-2 border-b border-border/30 bg-background/30">
                {["User", "Discord ID", "Servers", "Joined", "Actions"].map((h) => (
                  <span key={h} className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">{h}</span>
                ))}
              </div>
              {usersLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[1fr_140px_50px_80px_90px] gap-3 px-3 py-2.5 border-b border-border/20">
                    {[1,2,3,4,5].map((j) => <div key={j} className="h-3.5 rounded bg-border/30 animate-pulse" />)}
                  </div>
                ))
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">No users found</div>
              ) : users.map((u: any) => (
                <div key={u.id} className={cn("grid grid-cols-[1fr_140px_50px_80px_90px] gap-3 items-center px-3 py-2.5 border-b border-border/20 hover:bg-white/[0.02]", u.isBanned && "opacity-60")}>
                  <div className="flex items-center gap-2 min-w-0">
                    {u.image ? <img src={u.image} alt="" className="h-6 w-6 rounded-full shrink-0" /> : (
                      <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-blue-400">{u.username?.slice(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    <span className="text-[12px] font-medium truncate">{u.username}</span>
                    {u.isBanned && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 shrink-0">Banned</span>}
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[11px] text-muted-foreground font-mono truncate">{u.discordId}</span>
                    <CopyBtn text={u.discordId} />
                  </div>
                  <span className="text-[12px] text-center">{u.serverCount}</span>
                  <span className="text-[11px] text-muted-foreground">{format(new Date(u.createdAt), "MMM d, yy")}</span>
                  <div className="flex items-center gap-1.5">
                    {u.isBanned ? (
                      <button onClick={() => unbanUser(u.id)}
                        className="text-[10px] px-2 py-1 rounded border border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors">
                        Unban
                      </button>
                    ) : (
                      <button onClick={() => {
                        const reason = prompt(`Ban reason for ${u.username}? (optional)`);
                        if (reason === null) return;
                        banUser({ userId: u.id, banReason: reason || undefined });
                      }}
                        className="text-[10px] px-2 py-1 rounded border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors">
                        Ban
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {usersData && usersData.pages > 1 && (
              <Pages page={userPage} pages={usersData.pages} total={usersData.total} onPage={setUserPage} />
            )}
          </div>
        )}

        {/* Servers Tab */}
        {activeTab === "Servers" && (
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <SectionHeader icon={Globe} title="All Servers" subtitle={serversData ? `${serversData.total} total` : undefined}
              action={<button onClick={() => refetchServers()} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground"><RefreshCw className="h-3.5 w-3.5" /></button>} />
            <SearchInput value={serverSearch} onChange={(v) => { setServerSearch(v); setServerPage(1); }} placeholder="Search server name or Discord ID..." />
            <div className="rounded-lg border border-border/30 overflow-hidden">
              <div className="grid grid-cols-[1fr_110px_90px_60px_55px_110px_100px] gap-2 px-3 py-2 border-b border-border/30 bg-background/30">
                {["Server", "Owner", "Status", "Players", "Bans", "Expires", "Actions"].map((h) => (
                  <span key={h} className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">{h}</span>
                ))}
              </div>
              {serversLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[1fr_110px_90px_60px_55px_110px_100px] gap-2 px-3 py-2.5 border-b border-border/20">
                    {[1,2,3,4,5,6,7].map((j) => <div key={j} className="h-3.5 rounded bg-border/30 animate-pulse" />)}
                  </div>
                ))
              ) : servers.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">No servers found</div>
              ) : servers.map((s: any) => {
                const online = s.serverInfo?.isOnline ?? false;
                const expired = s.expiresAt ? new Date(s.expiresAt) < new Date() : false;
                return (
                  <div key={s.id} className="grid grid-cols-[1fr_110px_90px_60px_55px_110px_100px] gap-2 items-center px-3 py-2.5 border-b border-border/20 hover:bg-white/[0.02]">
                    <span className="text-[12px] font-medium truncate">{s.serverName}</span>
                    <span className="text-[11px] text-muted-foreground truncate">{s.ownerUsername}</span>
                    <div className="flex items-center gap-1.5">
                      {online ? <Wifi className="h-3 w-3 text-green-400 shrink-0" /> : <WifiOff className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                      <span className={cn("text-[11px]", online ? "text-green-400" : "text-muted-foreground/60")}>{online ? "Online" : "Offline"}</span>
                    </div>
                    <span className="text-[12px] text-muted-foreground">{s.serverInfo?.playerCount ?? 0}/{s.serverInfo?.maxSlots ?? 0}</span>
                    <span className={cn("text-[12px] font-medium", (s.banCount ?? 0) > 0 ? "text-red-400" : "text-muted-foreground")}>{s.banCount ?? 0}</span>
                    <span className={cn("text-[11px]", expired ? "text-red-400" : "text-amber-400")}>
                      {s.expiresAt ? formatDistanceToNow(new Date(s.expiresAt), { addSuffix: true }) : "—"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => {
                        setEditingServer(s);
                        setEditServerForm({
                          serverName: s.serverName,
                          expiresAt: s.expiresAt ? new Date(s.expiresAt).toISOString().slice(0, 10) : "",
                          isBanned: s.isBanned ?? false,
                          banReason: s.banReason ?? "",
                        });
                      }} className="h-6 w-6 flex items-center justify-center rounded border border-border/40 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-colors text-muted-foreground">
                        <Edit2 className="h-2.5 w-2.5" />
                      </button>
                      <button onClick={() => { if (confirm(`Reset IP for "${s.serverName}"?`)) resetIp(s.id); }}
                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-border/40 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-colors text-muted-foreground">
                        <RefreshCw className="h-2.5 w-2.5" />IP
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${s.serverName}"? Cannot be undone.`)) deleteServer(s.id); }}
                        className="h-6 w-6 flex items-center justify-center rounded border border-border/40 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors text-muted-foreground">
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {serversData && serversData.pages > 1 && (
              <Pages page={serverPage} pages={serversData.pages} total={serversData.total} onPage={setServerPage} />
            )}
          </div>
        )}

        {/* Keys Tab */}
        {activeTab === "Keys" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

            {/* Generator + unused keys — left col */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* Generator */}
              <div className="rounded-xl border border-border/50 bg-card p-5">
                <SectionHeader icon={Gift} title="Generate Keys" subtitle="Create new redemption keys" />
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground/70 mb-1 block">License Type</label>
                    <select value={keyType} onChange={(e) => setKeyType(e.target.value as any)}
                      className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50">
                      {LICENSE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground/70 mb-1 block">Count (1–10)</label>
                    <input type="number" min={1} max={10} value={keyCount}
                      onChange={(e) => setKeyCount(Math.min(10, Math.max(1, Number(e.target.value))))}
                      className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <button onClick={() => generateKeys({ type: keyType, count: keyCount })} disabled={generatingKeys}
                    className="flex items-center justify-center gap-2 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
                    <Gift className="h-3.5 w-3.5" />
                    {generatingKeys ? "Generating..." : `Generate ${keyCount} Key${keyCount > 1 ? "s" : ""}`}
                  </button>
                </div>
              </div>

              {/* Unused keys */}
              <div className="rounded-xl border border-border/50 bg-card p-5 flex-1">
                <SectionHeader icon={Key} title="Unused Keys" subtitle={unusedKeysData ? `${unusedKeysData.total} pending` : undefined}
                  action={<button onClick={() => refetchUnusedKeys()} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground"><RefreshCw className="h-3.5 w-3.5" /></button>} />
                <div className="flex flex-col gap-1.5">
                  {unusedKeysLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 rounded-lg bg-border/20 animate-pulse" />) :
                   unusedKeys.length === 0 ? <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">No unused keys</div> :
                   unusedKeys.map((k: any) => (
                    <div key={k.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/20 hover:border-border/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium shrink-0">
                          {k.type.charAt(0) + k.type.slice(1).toLowerCase()}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground truncate">{k.licenseKey}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <CopyBtn text={k.licenseKey} />
                        <button onClick={() => { if (confirm("Delete this key?")) deleteUnusedKey(k.id); }}
                          className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {unusedKeysData && unusedKeysData.pages > 1 && (
                  <Pages page={unusedKeyPage} pages={unusedKeysData.pages} total={unusedKeysData.total} onPage={setUnusedKeyPage} />
                )}
              </div>
            </div>

            {/* All redeemed keys — right col */}
            <div className="lg:col-span-3 rounded-xl border border-border/50 bg-card p-5">
              <SectionHeader icon={Server} title="Redeemed Keys" subtitle={licenseKeysData ? `${licenseKeysData.total} active licenses` : undefined}
                action={<button onClick={() => refetchLicenseKeys()} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground"><RefreshCw className="h-3.5 w-3.5" /></button>} />
              <SearchInput value={keySearch} onChange={(v) => { setKeySearch(v); setKeyPage(1); }} placeholder="Search key, server name, or Discord ID..." />
              <div className="rounded-lg border border-border/30 overflow-hidden">
                <div className="grid grid-cols-[1fr_120px_110px_90px_70px_80px] gap-2 px-3 py-2 border-b border-border/30 bg-background/30">
                  {["License Key", "Server", "Owner", "Expires", "Status", "Actions"].map((h) => (
                    <span key={h} className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">{h}</span>
                  ))}
                </div>
                {licenseKeysLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-[1fr_120px_110px_90px_70px_80px] gap-2 px-3 py-2.5 border-b border-border/20">
                      {[1,2,3,4,5,6].map((j) => <div key={j} className="h-3.5 rounded bg-border/30 animate-pulse" />)}
                    </div>
                  ))
                ) : licenseKeys.length === 0 ? (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">No redeemed keys found</div>
                ) : licenseKeys.map((l: any) => {
                  const expired = new Date(l.expiresAt) < new Date();
                  return (
                    <div key={l.id} className="grid grid-cols-[1fr_120px_110px_90px_70px_80px] gap-2 items-center px-3 py-2.5 border-b border-border/20 hover:bg-white/[0.02]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] font-mono text-muted-foreground truncate">{l.licenseKey}</span>
                        <CopyBtn text={l.licenseKey} />
                      </div>
                      <span className="text-[12px] font-medium truncate">{l.serverName}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{l.ownerUsername}</span>
                      <span className={cn("text-[11px]", expired ? "text-red-400" : "text-muted-foreground")}>
                        {formatDistanceToNow(new Date(l.expiresAt), { addSuffix: true })}
                      </span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                        l.isBanned ? "bg-red-500/10 text-red-400" :
                        expired ? "bg-orange-500/10 text-orange-400" :
                        "bg-green-500/10 text-green-400"
                      )}>
                        {l.isBanned ? "Banned" : expired ? "Expired" : "Active"}
                      </span>
                      <div className="flex items-center gap-1">
                        {l.isBanned ? (
                          <button
                            onClick={() => {
                              if (confirm(`Unban license for "${l.serverName}"?`))
                                updateServer({ serverId: l.id, isBanned: false, banReason: "" }, { onSuccess: () => { toast.success("License unbanned"); refetchLicenseKeys(); } });
                            }}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                          >
                            <CheckCircle className="h-2.5 w-2.5" />Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const reason = prompt(`Ban reason for "${l.serverName}" (optional):`);
                              if (reason === null) return;
                              updateServer({ serverId: l.id, isBanned: true, banReason: reason || undefined }, { onSuccess: () => { toast.success("License banned"); refetchLicenseKeys(); } });
                            }}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          >
                            <Ban className="h-2.5 w-2.5" />Ban
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {licenseKeysData && licenseKeysData.pages > 1 && (
                <Pages page={keyPage} pages={licenseKeysData.pages} total={licenseKeysData.total} onPage={setKeyPage} />
              )}
            </div>
          </div>
        )}

        {/* Bans Tab */}
        {activeTab === "Bans" && (
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <SectionHeader icon={Ban} title="Recent Global Bans" subtitle={`${bans.length} most recent across all servers`} />
            <div className="rounded-lg border border-border/30 overflow-hidden">
              <div className="grid grid-cols-[1fr_140px_1fr_110px] gap-3 px-3 py-2 border-b border-border/30 bg-background/30">
                {["Player", "Server", "Reason", "When"].map((h) => (
                  <span key={h} className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">{h}</span>
                ))}
              </div>
              {bansLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[1fr_140px_1fr_110px] gap-3 px-3 py-2.5 border-b border-border/20">
                    {[1,2,3,4].map((j) => <div key={j} className="h-3.5 rounded bg-border/30 animate-pulse" />)}
                  </div>
                ))
              ) : bans.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">No bans recorded</div>
              ) : bans.map((b: any) => (
                <div key={b.id} onClick={() => setSelectedBan(b)}
                  className="grid grid-cols-[1fr_140px_1fr_110px] gap-3 items-center px-3 py-2.5 border-b border-border/20 hover:bg-white/[0.04] cursor-pointer transition-colors">
                  <span className="text-[12px] font-medium truncate">{b.player?.playerName ?? "Unknown"}</span>
                  <span className="text-[11px] text-muted-foreground truncate">{b.license?.serverName}</span>
                  <span className="text-[11px] text-muted-foreground truncate">{b.reason ?? "—"}</span>
                  <span className="text-[11px] text-muted-foreground/70">
                    {formatDistanceToNow(new Date(b.bannedAt), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ban Detail Modal */}
        {selectedBan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBan(null)}>
            <div className="relative w-full max-w-lg rounded-xl border border-border/60 bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Ban className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{selectedBan.player?.playerName ?? "Unknown"}</p>
                    <p className="text-[11px] text-muted-foreground">Ban #{selectedBan.banId}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedBan(null)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <InfoField label="Ban ID" value={selectedBan.banId} mono />
                  <InfoField label="Server" value={selectedBan.license?.serverName ?? "—"} />
                  <InfoField label="Reason" value={selectedBan.reason ?? "—"} />
                  <InfoField label="Banned By" value={selectedBan.bannedBy ?? "—"} />
                  <InfoField label="Banned At" value={format(new Date(selectedBan.bannedAt), "MMM d, yyyy HH:mm")} />
                  {selectedBan.expiresAt && (
                    <InfoField label="Expires" value={format(new Date(selectedBan.expiresAt), "MMM d, yyyy HH:mm")} />
                  )}
                  {selectedBan.player?.playerLicense && (
                    <InfoField label="License" value={selectedBan.player.playerLicense} mono copyable />
                  )}
                  {selectedBan.evidenceUrl && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-1">Evidence</p>
                      <a href={selectedBan.evidenceUrl} target="_blank" rel="noreferrer"
                        className="text-[11px] text-blue-400 hover:underline truncate block">{selectedBan.evidenceUrl}</a>
                    </div>
                  )}
                </div>
                {selectedBan.identifiers && selectedBan.identifiers.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide mb-2">Identifiers</p>
                    <div className="flex flex-col gap-1.5 rounded-lg border border-border/30 overflow-hidden">
                      {selectedBan.identifiers.map((id: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border/20 last:border-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground font-medium shrink-0 uppercase">{id.type}</span>
                          <span className="text-[11px] font-mono text-muted-foreground truncate flex-1">{id.value}</span>
                          <CopyBtn text={id.value} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inline edit panel */}
                {editingBan?.id === selectedBan.id ? (
                  <div className="pt-3 border-t border-border/30 flex flex-col gap-3">
                    <p className="text-xs font-medium">Edit Ban</p>
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Reason</label>
                      <input value={editBanForm.reason} onChange={(e) => setEditBanForm(f => ({ ...f, reason: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Expires At (leave blank = permanent)</label>
                      <input type="datetime-local" value={editBanForm.expiresAt} onChange={(e) => setEditBanForm(f => ({ ...f, expiresAt: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateBan({ banId: selectedBan.id, reason: editBanForm.reason, expiresAt: editBanForm.expiresAt || null })}
                        disabled={updatingBan}
                        className="flex-1 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
                        {updatingBan ? "Saving..." : "Save"}
                      </button>
                      <button onClick={() => setEditingBan(null)} className="px-3 h-8 rounded-lg border border-border/50 text-xs hover:bg-white/5 transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-border/30 flex gap-2">
                    <button onClick={() => { setEditingBan(selectedBan); setEditBanForm({ reason: selectedBan.reason ?? "", expiresAt: selectedBan.expiresAt ? new Date(selectedBan.expiresAt).toISOString().slice(0, 16) : "" }); }}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-border/50 text-xs hover:bg-white/5 transition-colors">
                      <Edit2 className="h-3 w-3" />Edit
                    </button>
                    <button onClick={() => { if (confirm("Remove this ban? The player will be unbanned.")) deleteBan(selectedBan.id); }}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors">
                      <Trash2 className="h-3 w-3" />Unban
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Server Edit Modal */}
        {editingServer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setEditingServer(null)}>
            <div className="relative w-full max-w-md rounded-xl border border-border/60 bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Edit2 className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Edit Server</p>
                    <p className="text-[11px] text-muted-foreground">{editingServer.serverName}</p>
                  </div>
                </div>
                <button onClick={() => setEditingServer(null)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground/70 mb-1 block">Server Name</label>
                  <input value={editServerForm.serverName} onChange={(e) => setEditServerForm(f => ({ ...f, serverName: e.target.value }))}
                    className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground/70 mb-1 block">Expiry Date</label>
                  <input type="date" value={editServerForm.expiresAt} onChange={(e) => setEditServerForm(f => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                </div>
                <label className="flex items-center gap-2.5 text-xs cursor-pointer select-none px-1">
                  <input type="checkbox" checked={editServerForm.isBanned} onChange={(e) => setEditServerForm(f => ({ ...f, isBanned: e.target.checked }))} />
                  Banned
                </label>
                {editServerForm.isBanned && (
                  <div>
                    <label className="text-[10px] text-muted-foreground/70 mb-1 block">Ban Reason</label>
                    <input value={editServerForm.banReason} onChange={(e) => setEditServerForm(f => ({ ...f, banReason: e.target.value }))}
                      placeholder="Reason..."
                      className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                  </div>
                )}
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <button onClick={() => setEditingServer(null)} className="flex-1 h-8 rounded-lg border border-border/50 text-xs hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={() => updateServer({ serverId: editingServer.id, ...editServerForm })} disabled={updatingServer}
                  className="flex-1 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
                  {updatingServer ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discounts Tab */}
        {activeTab === "Discounts" && (
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <SectionHeader icon={Tag} title="Discount Codes" subtitle={`${discounts.length} codes`}
              action={
                <button onClick={() => setShowDiscountForm((v) => !v)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                  <Plus className="h-3 w-3" />New
                </button>
              } />

            {showDiscountForm && (
              <div className="mb-5 p-4 rounded-lg border border-border/30 bg-background/30 flex flex-col gap-3">
                <p className="text-xs font-medium">Create Discount Code</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground/70 mb-1 block">Code *</label>
                    <input value={discountForm.code} onChange={(e) => setDiscountForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                      placeholder="SAVE20"
                      className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs font-mono focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground/70 mb-1 block">Type</label>
                    <select value={discountForm.discountType} onChange={(e) => setDiscountForm((f) => ({ ...f, discountType: e.target.value as any }))}
                      className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50">
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED_AMOUNT">Fixed Amount</option>
                    </select>
                  </div>
                  {discountForm.discountType === "PERCENTAGE" ? (
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Discount %</label>
                      <input type="number" min={0} max={100} value={discountForm.discountPercentage}
                        onChange={(e) => setDiscountForm((f) => ({ ...f, discountPercentage: Number(e.target.value) }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Amount (cents)</label>
                      <input type="number" min={0} value={discountForm.discountAmount}
                        onChange={(e) => setDiscountForm((f) => ({ ...f, discountAmount: Number(e.target.value) }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] text-muted-foreground/70 mb-1 block">Expires At</label>
                    <input type="date" value={discountForm.expiresAt} onChange={(e) => setDiscountForm((f) => ({ ...f, expiresAt: e.target.value }))}
                      className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground/70 mb-1 block">Description</label>
                    <input value={discountForm.description} onChange={(e) => setDiscountForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Optional description..."
                      className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                  <input type="checkbox" checked={discountForm.autoApply}
                    onChange={(e) => setDiscountForm((f) => ({ ...f, autoApply: e.target.checked }))} className="rounded" />
                  Auto-apply this discount globally
                </label>
                <div className="flex gap-2">
                  <button onClick={() => createDiscount(discountForm)} disabled={creatingDiscount || !discountForm.code}
                    className="flex-1 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
                    {creatingDiscount ? "Creating..." : "Create Discount"}
                  </button>
                  <button onClick={() => setShowDiscountForm(false)}
                    className="px-3 h-8 rounded-lg border border-border/50 text-xs hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {discountsLoading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-border/20 animate-pulse" />)
              ) : discounts.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">No discount codes</div>
              ) : discounts.map((d: any) => {
                const expired = d.expiresAt && new Date(d.expiresAt) < new Date();
                return (
                  <div key={d.id} className={cn(
                    "rounded-lg border transition-colors",
                    d.isActive && !expired ? "border-border/40" : "border-border/20 opacity-60"
                  )}>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono font-semibold">{d.code}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                          {d.discountType === "PERCENTAGE" ? `${d.discountPercentage}%` : `€${(d.discountAmount / 100).toFixed(2)}`}
                        </span>
                        {d.autoApply && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">Auto-apply</span>}
                        {expired && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">Expired</span>}
                        {!d.isActive && !expired && <span className="text-[10px] px-1.5 py-0.5 rounded bg-border/40 text-muted-foreground">Disabled</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        {d.description && <span className="text-xs text-muted-foreground truncate">{d.description}</span>}
                        {d.expiresAt && !expired && (
                          <span className="text-[11px] text-muted-foreground/60 shrink-0">
                            Expires {formatDistanceToNow(new Date(d.expiresAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => {
                        setEditingDiscount(d);
                        setEditDiscountForm({
                          code: d.code, description: d.description ?? "", discountType: d.discountType,
                          discountAmount: d.discountAmount, discountPercentage: d.discountPercentage,
                          expiresAt: d.expiresAt ? new Date(d.expiresAt).toISOString().slice(0, 10) : "",
                          autoApply: d.autoApply, isActive: d.isActive,
                        });
                      }} className="h-7 w-7 flex items-center justify-center rounded border border-border/40 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 text-muted-foreground transition-colors">
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button onClick={() => toggleDiscount({ id: d.id, isActive: !d.isActive })}
                        className={cn("text-[11px] px-2.5 py-1 rounded border transition-colors",
                          d.isActive ? "border-border/40 text-muted-foreground hover:bg-white/5" : "border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/15"
                        )}>
                        {d.isActive ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => { if (confirm(`Delete "${d.code}"?`)) deleteDiscount(d.id); }}
                        className="h-7 w-7 flex items-center justify-center rounded border border-border/40 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-muted-foreground transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {editingDiscount?.id === d.id && (
                    <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground/70 mb-1 block">Code</label>
                        <input value={editDiscountForm.code} onChange={(e) => setEditDiscountForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                          className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs font-mono focus:outline-none focus:border-blue-500/50" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground/70 mb-1 block">Type</label>
                        <select value={editDiscountForm.discountType} onChange={(e) => setEditDiscountForm(f => ({ ...f, discountType: e.target.value as any }))}
                          className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50">
                          <option value="PERCENTAGE">Percentage</option>
                          <option value="FIXED_AMOUNT">Fixed Amount</option>
                        </select>
                      </div>
                      {editDiscountForm.discountType === "PERCENTAGE" ? (
                        <div>
                          <label className="text-[10px] text-muted-foreground/70 mb-1 block">Discount %</label>
                          <input type="number" min={0} max={100} value={editDiscountForm.discountPercentage}
                            onChange={(e) => setEditDiscountForm(f => ({ ...f, discountPercentage: Number(e.target.value) }))}
                            className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] text-muted-foreground/70 mb-1 block">Amount (cents)</label>
                          <input type="number" min={0} value={editDiscountForm.discountAmount}
                            onChange={(e) => setEditDiscountForm(f => ({ ...f, discountAmount: Number(e.target.value) }))}
                            className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                        </div>
                      )}
                      <div>
                        <label className="text-[10px] text-muted-foreground/70 mb-1 block">Expires At</label>
                        <input type="date" value={editDiscountForm.expiresAt} onChange={(e) => setEditDiscountForm(f => ({ ...f, expiresAt: e.target.value }))}
                          className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-muted-foreground/70 mb-1 block">Description</label>
                        <input value={editDiscountForm.description} onChange={(e) => setEditDiscountForm(f => ({ ...f, description: e.target.value }))}
                          className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                          <input type="checkbox" checked={editDiscountForm.autoApply} onChange={(e) => setEditDiscountForm(f => ({ ...f, autoApply: e.target.checked }))} />
                          Auto-apply globally
                        </label>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingDiscount(null)} className="px-3 h-7 rounded-lg border border-border/50 text-xs hover:bg-white/5 transition-colors">Cancel</button>
                          <button onClick={() => updateDiscount({ id: d.id, ...editDiscountForm, expiresAt: editDiscountForm.expiresAt || null })}
                            disabled={updatingDiscount}
                            className="px-3 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
                            {updatingDiscount ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Expiring Tab */}
        {activeTab === "Expiring" && (
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <SectionHeader icon={Clock} title="Expiring Licenses" subtitle="Licenses expiring within 14 days" />
            <div className="rounded-lg border border-border/30 overflow-hidden mt-4">
              <div className="grid grid-cols-[1fr_120px_80px_100px] gap-3 px-3 py-2 border-b border-border/30 bg-background/30">
                {["Server", "Owner", "Days Left", "Expires"].map((h) => (
                  <span key={h} className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">{h}</span>
                ))}
              </div>
              {expiringLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[1fr_120px_80px_100px] gap-3 px-3 py-2.5 border-b border-border/20">
                    {[1,2,3,4].map((j) => <div key={j} className="h-3.5 rounded bg-border/30 animate-pulse" />)}
                  </div>
                ))
              ) : !expiringData || expiringData.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">No licenses expiring in the next 14 days</div>
              ) : expiringData.map((l: any) => (
                <div key={l.id} className="grid grid-cols-[1fr_120px_80px_100px] gap-3 items-center px-3 py-2.5 border-b border-border/20 hover:bg-white/[0.02]">
                  <span className="text-[12px] font-medium truncate">{l.serverName}</span>
                  <span className="text-[11px] text-muted-foreground truncate">{l.ownerUsername}</span>
                  <span className={cn("text-[12px] font-semibold", l.daysLeft <= 1 ? "text-red-400" : l.daysLeft <= 3 ? "text-orange-400" : "text-amber-400")}>
                    {l.daysLeft === 0 ? "Today" : l.daysLeft === 1 ? "Tomorrow" : `${l.daysLeft}d`}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{format(new Date(l.expiresAt), "MMM d, yy")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "Logs" && (
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <SectionHeader icon={BarChart3} title="System Activity" subtitle="Recent admin & system actions across all servers"
              action={<button onClick={() => refetchLogs()} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-muted-foreground"><RefreshCw className="h-3.5 w-3.5" /></button>} />
            <div className="rounded-lg border border-border/30 overflow-hidden mt-4">
              <div className="grid grid-cols-[140px_1fr_120px_100px] gap-3 px-3 py-2 border-b border-border/30 bg-background/30">
                {["Action", "Server", "By", "Time"].map((h) => (
                  <span key={h} className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide">{h}</span>
                ))}
              </div>
              {logsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[140px_1fr_120px_100px] gap-3 px-3 py-2.5 border-b border-border/20">
                    {[1,2,3,4].map((j) => <div key={j} className="h-3.5 rounded bg-border/30 animate-pulse" />)}
                  </div>
                ))
              ) : !systemLogs || systemLogs.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">No system logs</div>
              ) : systemLogs.map((log: any) => (
                <div key={log.id} className="grid grid-cols-[140px_1fr_120px_100px] gap-3 items-center px-3 py-2 border-b border-border/20 hover:bg-white/[0.02]">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono w-fit",
                    log.systemType === "IP_RESET" ? "bg-orange-500/10 text-orange-400" :
                    log.systemType === "SERVER_CREATE" ? "bg-green-500/10 text-green-400" :
                    log.systemType === "SERVER_RENAME" ? "bg-blue-500/10 text-blue-400" :
                    log.systemType === "MEMBER_ADD" ? "bg-violet-500/10 text-violet-400" :
                    log.systemType === "MEMBER_REMOVE" ? "bg-red-500/10 text-red-400" :
                    "bg-border/30 text-muted-foreground"
                  )}>{log.systemType?.replace(/_/g, " ")}</span>
                  <span className="text-[11px] text-muted-foreground truncate">{log.license?.serverName ?? "—"}</span>
                  <span className="text-[11px] text-muted-foreground font-mono truncate">{log.memberId ?? "—"}</span>
                  <span className="text-[10px] text-muted-foreground/60">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Tab */}
        {activeTab === "Status" && (
          <div className="flex flex-col gap-4">
            {/* Customer Notification Section */}
            <div className="rounded-xl border border-blue-500/20 bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Megaphone className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">Customer Notifications</h2>
                    <p className="text-xs text-muted-foreground">Broadcast a notice to all customers via status page & dashboard</p>
                  </div>
                </div>
                <button onClick={() => { setShowNotificationForm(v => !v); setShowIncidentForm(false); setShowMaintenanceForm(false); }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors font-medium">
                  <Plus className="h-3 w-3" />Broadcast Notice
                </button>
              </div>

              {showNotificationForm && (
                <div className="mb-4 p-4 rounded-lg border border-blue-500/20 bg-blue-500/5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ZapOff className="h-3.5 w-3.5 text-blue-400" />
                    <p className="text-xs font-semibold text-blue-400">Publish Status Notice</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Title *</label>
                      <input value={notificationForm.title} onChange={e => setNotificationForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Scheduled maintenance tonight"
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Severity</label>
                      <select value={notificationForm.severity} onChange={e => setNotificationForm(f => ({ ...f, severity: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50">
                        <option value="none">Info</option>
                        <option value="minor">Minor</option>
                        <option value="major">Major</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Message *</label>
                      <textarea value={notificationForm.message} onChange={e => setNotificationForm(f => ({ ...f, message: e.target.value }))}
                        placeholder="This appears on the status page and in every customer's dashboard until resolved or deleted."
                        rows={3}
                        className="w-full px-2.5 py-2 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50 resize-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => createNotification({ title: notificationForm.title, impact: notificationForm.severity as any, status: "identified", message: notificationForm.message })}
                      disabled={creatingNotification || !notificationForm.title || !notificationForm.message}
                      className="flex-1 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
                      {creatingNotification ? "Publishing..." : "Publish Notice"}
                    </button>
                    <a href="https://status.vexonac.com" target="_blank" rel="noopener noreferrer"
                      className="px-3 h-8 rounded-lg border border-border/50 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors flex items-center gap-1.5">
                      <Globe className="h-3 w-3" />Status Page
                    </a>
                    <button onClick={() => setShowNotificationForm(false)}
                      className="px-3 h-8 rounded-lg border border-border/50 text-xs hover:bg-white/5 transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground/60">
                Notices appear on <span className="text-muted-foreground">status.vexonac.com</span> and as a dismissable banner on every customer's dashboard. Use <span className="text-muted-foreground">Update</span> below to resolve them, or delete to remove immediately.
              </p>
            </div>

            {/* Incidents Section */}
            <div className="rounded-xl border border-border/50 bg-card p-5">
              <SectionHeader icon={AlertTriangle} title="Incidents" subtitle={`${(statusData?.incidents ?? []).filter((i: any) => i.status !== 'resolved').length} active`}
                action={
                  <button onClick={() => { setShowIncidentForm(v => !v); setShowMaintenanceForm(false); }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors">
                    <Plus className="h-3 w-3" />New Incident
                  </button>
                } />

              {showIncidentForm && (
                <div className="mb-4 p-4 rounded-lg border border-border/30 bg-background/30 flex flex-col gap-3">
                  <p className="text-xs font-medium">Create Incident</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Title *</label>
                      <input value={incidentForm.title} onChange={e => setIncidentForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Panel experiencing elevated error rates"
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-red-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Impact</label>
                      <select value={incidentForm.impact} onChange={e => setIncidentForm(f => ({ ...f, impact: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-red-500/50">
                        <option value="none">None</option>
                        <option value="minor">Minor</option>
                        <option value="major">Major</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Initial Status</label>
                      <select value={incidentForm.status} onChange={e => setIncidentForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-red-500/50">
                        <option value="investigating">Investigating</option>
                        <option value="identified">Identified</option>
                        <option value="monitoring">Monitoring</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Initial Message *</label>
                      <textarea value={incidentForm.message} onChange={e => setIncidentForm(f => ({ ...f, message: e.target.value }))}
                        placeholder="Describe what's happening..."
                        rows={3}
                        className="w-full px-2.5 py-2 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-red-500/50 resize-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => createIncident(incidentForm as any)} disabled={creatingIncident || !incidentForm.title || !incidentForm.message}
                      className="flex-1 h-8 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
                      {creatingIncident ? "Creating..." : "Create Incident"}
                    </button>
                    <button onClick={() => setShowIncidentForm(false)}
                      className="px-3 h-8 rounded-lg border border-border/50 text-xs hover:bg-white/5 transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              {/* Update incident modal */}
              {selectedIncident && (
                <div className="mb-4 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 flex flex-col gap-3">
                  <p className="text-xs font-medium">Post Update — <span className="text-amber-400">{selectedIncident.title}</span></p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">New Status</label>
                      <select value={incidentUpdateStatus} onChange={e => setIncidentUpdateStatus(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none">
                        <option value="investigating">Investigating</option>
                        <option value="identified">Identified</option>
                        <option value="monitoring">Monitoring</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Message *</label>
                      <textarea value={incidentUpdateMsg} onChange={e => setIncidentUpdateMsg(e.target.value)}
                        placeholder="Update message..."
                        rows={2}
                        className="w-full px-2.5 py-2 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none resize-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addIncidentUpdate({ incidentId: selectedIncident.id, message: incidentUpdateMsg, status: incidentUpdateStatus as any })}
                      disabled={addingUpdate || !incidentUpdateMsg}
                      className="flex-1 h-8 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
                      {addingUpdate ? "Posting..." : "Post Update"}
                    </button>
                    <button onClick={() => setSelectedIncident(null)}
                      className="px-3 h-8 rounded-lg border border-border/50 text-xs hover:bg-white/5 transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {statusLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-lg bg-border/20 animate-pulse" />)
                ) : (statusData?.incidents ?? []).length === 0 ? (
                  <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">No incidents</div>
                ) : (statusData?.incidents ?? []).map((inc: any) => {
                  const impactColor: Record<string, string> = { critical: "text-red-400 bg-red-500/10", major: "text-orange-400 bg-orange-500/10", minor: "text-yellow-400 bg-yellow-500/10", none: "text-muted-foreground bg-border/30" };
                  const statusColor: Record<string, string> = { investigating: "text-red-400", identified: "text-orange-400", monitoring: "text-amber-400", resolved: "text-green-400" };
                  return (
                    <div key={inc.id} className={cn("rounded-lg border p-3 flex flex-col gap-2", inc.status === "resolved" ? "border-border/20 opacity-60" : "border-border/40")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium truncate">{inc.title}</span>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", impactColor[inc.impact] || impactColor.none)}>{inc.impact}</span>
                            <span className={cn("text-[10px] font-medium", statusColor[inc.status] || "text-muted-foreground")}>{inc.status}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground/60">{format(new Date(inc.createdAt), "MMM d, yyyy HH:mm")}</span>
                          {inc.updates.length > 0 && (
                            <div className="mt-1 flex flex-col gap-1">
                              {inc.updates.slice(0, 2).map((u: any) => (
                                <p key={u.id} className="text-[11px] text-muted-foreground/70 line-clamp-1">• {u.message}</p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {inc.status !== "resolved" && (
                            <button onClick={() => { setSelectedIncident(inc); setIncidentUpdateStatus("monitoring"); setIncidentUpdateMsg(""); }}
                              className="text-[11px] px-2 py-1 rounded border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors">Update</button>
                          )}
                          <button onClick={() => { if (confirm("Delete this incident?")) deleteIncident({ id: inc.id }); }}
                            className="h-6 w-6 flex items-center justify-center rounded border border-border/40 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-muted-foreground transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Maintenance Section */}
            <div className="rounded-xl border border-border/50 bg-card p-5">
              <SectionHeader icon={Wrench} title="Maintenance Windows" subtitle={`${(statusData?.maintenance ?? []).filter((m: any) => m.status !== 'completed' && m.status !== 'cancelled').length} scheduled`}
                action={
                  <button onClick={() => { setShowMaintenanceForm(v => !v); setShowIncidentForm(false); }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                    <Plus className="h-3 w-3" />Schedule
                  </button>
                } />

              {showMaintenanceForm && (
                <div className="mb-4 p-4 rounded-lg border border-border/30 bg-background/30 flex flex-col gap-3">
                  <p className="text-xs font-medium">Schedule Maintenance</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Title *</label>
                      <input value={maintenanceForm.title} onChange={e => setMaintenanceForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Database migration"
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Start *</label>
                      <input type="datetime-local" value={maintenanceForm.scheduledStart} onChange={e => setMaintenanceForm(f => ({ ...f, scheduledStart: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">End *</label>
                      <input type="datetime-local" value={maintenanceForm.scheduledEnd} onChange={e => setMaintenanceForm(f => ({ ...f, scheduledEnd: e.target.value }))}
                        className="w-full h-8 px-2.5 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-muted-foreground/70 mb-1 block">Description</label>
                      <textarea value={maintenanceForm.description} onChange={e => setMaintenanceForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="What will be affected..." rows={2}
                        className="w-full px-2.5 py-2 rounded-lg border border-border/50 bg-background/50 text-xs focus:outline-none focus:border-blue-500/50 resize-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => createMaintenance(maintenanceForm as any)} disabled={creatingMaintenance || !maintenanceForm.title || !maintenanceForm.scheduledStart || !maintenanceForm.scheduledEnd}
                      className="flex-1 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
                      {creatingMaintenance ? "Scheduling..." : "Schedule Maintenance"}
                    </button>
                    <button onClick={() => setShowMaintenanceForm(false)}
                      className="px-3 h-8 rounded-lg border border-border/50 text-xs hover:bg-white/5 transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {statusLoading ? (
                  Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-14 rounded-lg bg-border/20 animate-pulse" />)
                ) : (statusData?.maintenance ?? []).length === 0 ? (
                  <div className="flex items-center justify-center h-14 text-xs text-muted-foreground">No maintenance scheduled</div>
                ) : (statusData?.maintenance ?? []).map((m: any) => {
                  const mColor: Record<string, string> = { scheduled: "text-blue-400 bg-blue-500/10", in_progress: "text-amber-400 bg-amber-500/10", completed: "text-green-400 bg-green-500/10", cancelled: "text-muted-foreground bg-border/30" };
                  return (
                    <div key={m.id} className={cn("rounded-lg border border-border/40 p-3 flex items-start justify-between gap-3", (m.status === "completed" || m.status === "cancelled") && "opacity-60")}>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{m.title}</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", mColor[m.status] || "text-muted-foreground bg-border/30")}>{m.status.replace("_", " ")}</span>
                        </div>
                        {m.description && <p className="text-[11px] text-muted-foreground/70">{m.description}</p>}
                        <span className="text-[10px] text-muted-foreground/60">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {format(new Date(m.scheduledStart), "MMM d, HH:mm")} → {format(new Date(m.scheduledEnd), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {m.status === "scheduled" && (
                          <button onClick={() => updateMaintenanceStatus({ id: m.id, status: "in_progress" })}
                            className="text-[11px] px-2 py-1 rounded border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors">Start</button>
                        )}
                        {m.status === "in_progress" && (
                          <button onClick={() => updateMaintenanceStatus({ id: m.id, status: "completed" })}
                            className="text-[11px] px-2 py-1 rounded border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">Complete</button>
                        )}
                        {(m.status === "scheduled" || m.status === "in_progress") && (
                          <button onClick={() => updateMaintenanceStatus({ id: m.id, status: "cancelled" })}
                            className="text-[11px] px-2 py-1 rounded border border-border/40 text-muted-foreground hover:bg-white/5 transition-colors">Cancel</button>
                        )}
                        <button onClick={() => { if (confirm("Delete this maintenance?")) deleteMaintenance({ id: m.id }); }}
                          className="h-6 w-6 flex items-center justify-center rounded border border-border/40 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-muted-foreground transition-colors">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === "Admins" && (
          <div className="space-y-4">
            <SectionHeader
              icon={ShieldUser}
              title="Panel Admins"
              subtitle="Username/password admin accounts for the panel"
              action={
                <button onClick={() => setShowAdminForm((v) => !v)}
                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                  <Plus className="h-3 w-3" />
                  {showAdminForm ? "Cancel" : "New Admin"}
                </button>
              }
            />
            {showAdminForm && (
              <div className="border border-border/50 rounded-xl bg-card/50 p-4 space-y-3">
                <p className="text-xs font-medium">Create Admin Account</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Username</p>
                    <input value={adminUserForm.username} onChange={(e) => setAdminUserForm((f) => ({ ...f, username: e.target.value }))}
                      placeholder="admin_username" className="w-full h-8 px-2 text-xs rounded-lg border border-border/50 bg-background/50 focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Password (min 8 chars)</p>
                    <input type="password" value={adminUserForm.password} onChange={(e) => setAdminUserForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••" className="w-full h-8 px-2 text-xs rounded-lg border border-border/50 bg-background/50 focus:outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Role</p>
                    <select value={adminUserForm.role} onChange={(e) => setAdminUserForm((f) => ({ ...f, role: e.target.value as any }))}
                      className="w-full h-8 px-2 text-xs rounded-lg border border-border/50 bg-background/50 focus:outline-none focus:border-blue-500/50">
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>
                </div>
                <button onClick={() => createAdminUser(adminUserForm)} disabled={!adminUserForm.username || !adminUserForm.password || creatingAdminUser}
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 disabled:opacity-50 transition-colors">
                  {creatingAdminUser ? "Creating..." : "Create Admin"}
                </button>
              </div>
            )}
            {adminUsersLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 rounded bg-border/20 animate-pulse" />)}</div>
            ) : !adminUsersData?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldUser className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No panel admin accounts yet.</p>
                <p className="text-xs mt-1">Create one above to allow username/password login.</p>
                <a href="/admin-login" className="text-xs text-primary underline underline-offset-2 mt-2 block">
                  Admin login page →
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {adminUsersData.map((admin: any) => (
                  <div key={admin.id} className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card/30">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium">{admin.username}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{admin.role} · Created {formatDistanceToNow(new Date(admin.createdAt), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {changePwId === admin.id ? (
                        <div className="flex items-center gap-2">
                          <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password" autoFocus
                            className="h-7 px-2 text-xs rounded border border-border/50 bg-background/50 focus:outline-none focus:border-blue-500/50 w-32" />
                          <button onClick={() => changeAdminPw({ id: admin.id, newPassword: newPw })} disabled={newPw.length < 8 || changingPw}
                            className="text-[11px] px-2 py-1 rounded border border-green-500/30 text-green-400 hover:bg-green-500/10 disabled:opacity-50 transition-colors">
                            {changingPw ? "..." : "Save"}
                          </button>
                          <button onClick={() => { setChangePwId(null); setNewPw(""); }}
                            className="text-[11px] px-2 py-1 rounded border border-border/40 text-muted-foreground hover:bg-white/5 transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setChangePwId(admin.id); setNewPw(""); }}
                          className="text-[11px] px-2 py-1 rounded border border-border/40 text-muted-foreground hover:bg-white/5 transition-colors">Change pw</button>
                      )}
                      <button onClick={() => { if (confirm(`Delete admin "${admin.username}"?`)) deleteAdminUser(admin.id); }}
                        className="h-7 w-7 flex items-center justify-center rounded border border-border/40 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-muted-foreground transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground pt-2 text-center">
                  Admin login: <a href="/admin-login" className="text-primary underline underline-offset-2">/admin-login</a>
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </ContentLayout>
  );
}
