"use client";

import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  AlertTriangle,
  BarChart3,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Info,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Skull,
  Swords,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Constants ───────────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; ring: string; dot: string }> = {
  CRITICAL: {
    label: "Critical", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30",
    ring: "ring-red-500/50", dot: "bg-red-400",
  },
  HIGH: {
    label: "High", color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30",
    ring: "ring-orange-500/50", dot: "bg-orange-400",
  },
  MEDIUM: {
    label: "Medium", color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30",
    ring: "ring-yellow-500/50", dot: "bg-yellow-400",
  },
  LOW: {
    label: "Low", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30",
    ring: "ring-blue-500/50", dot: "bg-blue-400",
  },
};

const SEVERITY_ICONS: Record<string, React.ElementType> = {
  CRITICAL: Zap, HIGH: ShieldAlert, MEDIUM: AlertTriangle, LOW: Swords,
};

const CODE_LABELS: Record<string, { label: string; desc: string }> = {
  INVINCIBLE:      { label: "Invincibility",        desc: "Player is invincible to all damage" },
  GODMODE:         { label: "God Mode",              desc: "Abnormally high health regeneration or no damage taken" },
  NOCLIP:          { label: "No-Clip",               desc: "Player moving through solid objects" },
  SPEED_HACK:      { label: "Speed Hack",            desc: "Movement speed exceeds maximum thresholds" },
  SUPER_JUMP:      { label: "Super Jump",            desc: "Jump height or velocity exceeds normal limits" },
  TELEPORT:        { label: "Teleport",              desc: "Position changed beyond physically possible distance" },
  EXPLOSION_SPAM:  { label: "Explosion Spam",        desc: "Creating explosions at an abnormal rate" },
  BLACKLIST_WEP:   { label: "Blacklisted Weapon",   desc: "Using a weapon that is not allowed on this server" },
  BLACKLIST_VEH:   { label: "Blacklisted Vehicle",  desc: "Spawned a vehicle that is not allowed on this server" },
  ENTITY_SPAM:     { label: "Entity Spam",           desc: "Creating entities (props/vehicles) at an abnormal rate" },
  INFINITE_AMMO:   { label: "Infinite Ammo",        desc: "Ammunition never depletes despite firing" },
  RAPID_HEAL:      { label: "Rapid Heal",            desc: "Health regenerates faster than game mechanics allow" },
  INVISIBLE:       { label: "Invisible",             desc: "Player is invisible to other players" },
  RESOURCE_INJECT: { label: "Resource Injection",   desc: "Unknown resource started mid-session (cheat menu)" },
  FREEZE_HACK:     { label: "Freeze Hack",           desc: "Player or entity frozen in an impossible state" },
  DAMAGE_MOD:      { label: "Damage Modifier",      desc: "Weapon damage exceeds maximum possible values" },
  MENU_DETECTED:   { label: "Cheat Menu",            desc: "Cheat menu globals or signatures detected in memory" },
  NET_FLOOD:       { label: "Network Flood",         desc: "Sending network events at an abnormal rate" },
  VEHICLE_SPAWN:   { label: "Vehicle Spawn",         desc: "Spawning vehicles at an abnormal rate" },
  SUPER_DAMAGE:    { label: "Super Damage",          desc: "Dealing damage far exceeding weapon capability" },
  OBJ_SPAM:        { label: "Object Spam",           desc: "Spawning objects/props at an abnormal rate" },
  SPECTATOR_ABUSE: { label: "Spectator Abuse",      desc: "Abusing spectator or free camera mode" },
  AIMBOT:          { label: "Aimbot",                desc: "Abnormal aim snap, lock-on, or headshot ratio detected" },
  FREECAM:         { label: "Free Camera",           desc: "Camera moved far from player without a valid reason" },
  HWID_BAN:        { label: "HWID Ban",              desc: "Hardware fingerprint matches a banned device" },
  ECONOMY_EXPLOIT: { label: "Economy Exploit",      desc: "Triggering server-side money/inventory events from client" },
};

// ─── Evidence Modal ──────────────────────────────────────────────────────────
function EvidenceModal({
  detection,
  onClose,
  serverId,
}: {
  detection: any;
  onClose: () => void;
  serverId: string;
}) {
  const details = detection.evidence || {};
  const screenshotUrl = detection.screenshotUrl || details.screenshotUrl;
  const { label, desc } = CODE_LABELS[detection.code] ?? { label: detection.code, desc: "" };
  const sev = SEVERITY_CONFIG[detection.severity] ?? SEVERITY_CONFIG.LOW;
  const SevIcon = SEVERITY_ICONS[detection.severity] ?? AlertTriangle;

  const cleanEvidence = { ...details };
  delete cleanEvidence.screenshotUrl;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(cleanEvidence, null, 2));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", sev.bg)}>
              <SevIcon className={cn("h-4 w-4", sev.color)} />
            </div>
            <div>
              <span>{label}</span>
              <p className="text-xs text-muted-foreground font-normal mt-0.5">{desc}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-xs text-muted-foreground mb-1">Player</p>
              <p className="text-sm font-semibold flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {detection.playerName || "Unknown"}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-xs text-muted-foreground mb-1">Detected</p>
              <p className="text-sm font-semibold">
                {format(new Date(detection.createdAt), "MMM d, yyyy HH:mm:ss")}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-xs text-muted-foreground mb-1">Severity</p>
              <Badge className={cn("text-xs font-semibold border", sev.bg, sev.color, sev.border)}>
                {sev.label}
              </Badge>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-xs text-muted-foreground mb-1">Detection Code</p>
              <p className="text-sm font-mono font-bold text-foreground/80">{detection.code}</p>
            </div>
            {details.points !== undefined && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-xs text-muted-foreground mb-1">Threat Points</p>
                <p className="text-sm font-bold text-orange-400">+{details.points} pts</p>
              </div>
            )}
            {details.score !== undefined && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Score</p>
                <p className="text-sm font-bold">{details.score} pts</p>
              </div>
            )}
          </div>

          {/* Screenshot */}
          {screenshotUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                  Screenshot Evidence
                </p>
                <a href={screenshotUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                    <ExternalLink className="h-3 w-3" /> Open full size
                  </Button>
                </a>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshotUrl}
                  alt="Detection screenshot"
                  className="w-full object-contain max-h-72 hover:max-h-[600px] transition-all duration-500 cursor-zoom-in"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

          {/* Evidence data */}
          {Object.keys(cleanEvidence).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  Detection Data
                </p>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={copyJson}>
                  <Copy className="h-3 w-3" /> Copy JSON
                </Button>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap break-all leading-relaxed">
                  {JSON.stringify(cleanEvidence, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!screenshotUrl && Object.keys(cleanEvidence).length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <Info className="h-8 w-8 text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground">No additional evidence recorded</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-white/[0.05]">
            <Link
              href={`/dashboard/server/${serverId}/lookup?license=${encodeURIComponent(detection.playerLicense || "")}`}
              className="flex-1"
            >
              <Button variant="outline" className="w-full gap-2 text-xs">
                <User className="h-3.5 w-3.5" />
                View Player Profile
              </Button>
            </Link>
            <Button variant="outline" className="gap-2 text-xs" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detection row ───────────────────────────────────────────────────────────
function DetectionRow({
  detection,
  onViewEvidence,
  serverId,
}: {
  detection: any;
  onViewEvidence: (d: any) => void;
  serverId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_CONFIG[detection.severity] ?? SEVERITY_CONFIG.LOW;
  const SevIcon = SEVERITY_ICONS[detection.severity] ?? AlertTriangle;
  const { label } = CODE_LABELS[detection.code] ?? { label: detection.code };
  const details = detection.evidence || {};
  const hasScreenshot = !!(detection.screenshotUrl || details.screenshotUrl);
  const hasEvidence = Object.keys(details).length > 0 || hasScreenshot;

  return (
    <>
      <tr
        className={cn(
          "border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors",
          expanded && "bg-white/[0.02]"
        )}
      >
        <td className="px-4 py-3">
          <Badge className={cn("text-[11px] font-semibold border gap-1", sev.bg, sev.color, sev.border)}>
            <SevIcon className="h-2.5 w-2.5" />
            {sev.label}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground font-mono">{detection.code}</p>
          </div>
        </td>
        <td className="px-4 py-3">
          <Link
            href={`/dashboard/server/${serverId}/lookup?license=${encodeURIComponent(detection.playerLicense || "")}`}
            className="flex items-center gap-1.5 text-sm font-medium hover:text-blue-400 transition-colors group"
          >
            {detection.playerName || "Unknown"}
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(detection.createdAt), { addSuffix: true })}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {hasScreenshot && (
              <span title="Has screenshot" className="flex items-center">
                <Camera className="h-3.5 w-3.5 text-blue-400" />
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onViewEvidence(detection)}
            >
              <Eye className="h-3 w-3" />
              Evidence
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-white/[0.03] bg-black/20">
          <td colSpan={5} className="px-4 py-3">
            <div className="space-y-3">
              {hasScreenshot && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">📸 Screenshot</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detection.screenshotUrl || details.screenshotUrl}
                    alt="Evidence"
                    className="max-h-48 rounded-lg border border-white/[0.06] object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
              {Object.keys(details).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium">🔍 Detection Data</p>
                  <div className="rounded-lg bg-black/30 border border-white/[0.05] p-3">
                    <pre className="text-[11px] font-mono text-foreground/70 whitespace-pre-wrap break-all">
                      {JSON.stringify(details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {!hasEvidence && (
                <p className="text-xs text-muted-foreground italic">No evidence recorded for this detection</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Custom bar tooltip ──────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-background/95 backdrop-blur-sm px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold mb-1">{CODE_LABELS[label]?.label ?? label}</p>
      <p className="text-muted-foreground">{payload[0].value} detections</p>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function DetectionsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const serverId = params.serverId as string;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [evidenceDetection, setEvidenceDetection] = useState<any>(null);

  const { data: server } = useQuery(
    trpc.servers.getServer.queryOptions(serverId, { enabled: !!session })
  );

  const { data, isLoading, refetch } = useQuery(
    trpc.servers.getDetections.queryOptions(
      { serverId, page, limit: 25, search: search || undefined } as any,
      { enabled: !!session }
    )
  );

  const { data: stats } = useQuery(
    trpc.servers.getDetectionStats.queryOptions(
      { serverId, days: 7 },
      { enabled: !!session }
    )
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const filtered = (data?.detections ?? []).filter(
    (d: any) => severityFilter === "all" || d.severity === severityFilter
  );

  const barData = (stats?.codeBreakdown ?? []).slice(0, 10).map((c: any) => ({
    code: c.code,
    count: Number(c.count),
    label: CODE_LABELS[c.code]?.label ?? c.code,
  }));

  const SCAT_COLORS: Record<string, string> = {
    CRITICAL: "#f87171", HIGH: "#fb923c", MEDIUM: "#fbbf24", LOW: "#60a5fa",
  };

  return (
    <ContentLayout title={<>Detections — {formatServerName(server?.serverName)}</>}>
      {evidenceDetection && (
        <EvidenceModal
          detection={evidenceDetection}
          onClose={() => setEvidenceDetection(null)}
          serverId={serverId}
        />
      )}

      <div className="space-y-6">
        {/* ── Severity summary tiles ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => {
            const cfg = SEVERITY_CONFIG[sev];
            const SevIcon = SEVERITY_ICONS[sev];
            const count = data?.severityCounts?.[sev] ?? 0;
            const isActive = severityFilter === sev;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(isActive ? "all" : sev)}
                className={cn(
                  "rounded-2xl border p-4 flex flex-col gap-3 text-left transition-all hover:scale-[1.01]",
                  isActive
                    ? cn(cfg.bg, cfg.border, "ring-2", cfg.ring)
                    : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", cfg.bg, cfg.border, "border")}>
                    <SevIcon className={cn("h-4 w-4", cfg.color)} />
                  </div>
                  {count > 0 && <span className={cn("h-2 w-2 rounded-full animate-pulse", cfg.dot)} />}
                </div>
                <div>
                  <p className="text-2xl font-bold">{isLoading ? "—" : count}</p>
                  <p className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Analytics row ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Bar chart */}
          <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold">Detection Breakdown</h3>
                <p className="text-xs text-muted-foreground">Top detection codes — last 7 days</p>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground/40" />
            </div>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="code" tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={(v) => CODE_LABELS[v]?.label?.split(" ")[0] ?? v} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {barData.map((entry: any, i: number) => (
                      <Cell key={i} fill={`hsl(${220 + i * 15}, 80%, 60%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-muted-foreground/50">No detection data yet</p>
              </div>
            )}
          </div>

          {/* Top offenders */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold">Top Offenders</h3>
            </div>
            <div className="flex-1 space-y-2">
              {(stats?.topOffenders ?? []).slice(0, 6).map((o: any, i: number) => (
                <Link
                  key={o.playerLicense}
                  href={`/dashboard/server/${serverId}/lookup?license=${encodeURIComponent(o.playerLicense)}`}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                >
                  <span className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    i === 0 ? "bg-amber-400/20 text-amber-400" :
                    i === 1 ? "bg-zinc-400/20 text-zinc-400" :
                    i === 2 ? "bg-orange-600/20 text-orange-600" :
                    "bg-white/[0.05] text-muted-foreground"
                  )}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate group-hover:text-blue-400 transition-colors">
                      {o.playerName || "Unknown"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate font-mono">
                      {o.playerLicense?.slice(0, 20)}…
                    </p>
                  </div>
                  <span className="text-xs font-bold text-orange-400 shrink-0">{o.count}×</span>
                </Link>
              ))}
              {(!stats?.topOffenders || stats.topOffenders.length === 0) && (
                <div className="flex-1 flex items-center justify-center py-8">
                  <p className="text-xs text-muted-foreground/50">No data yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 max-w-sm flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search player or code…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-9 bg-white/[0.03] border-white/[0.08] text-sm"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-9 shrink-0">
              Search
            </Button>
          </form>
          <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 h-9 bg-white/[0.03] border-white/[0.08] text-sm">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="CRITICAL">🔴 Critical</SelectItem>
              <SelectItem value="HIGH">🟠 High</SelectItem>
              <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
              <SelectItem value="LOW">🔵 Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* ── Detection table ── */}
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detection</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Player</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-36">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.03]">
                      <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-7 w-24 rounded-lg" /></td>
                    </tr>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((detection: any) => (
                    <DetectionRow
                      key={detection.id}
                      detection={detection}
                      onViewEvidence={setEvidenceDetection}
                      serverId={serverId}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <ShieldAlert className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No detections found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && (data.pagination?.total ?? 0) > 25 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.05]">
              <p className="text-xs text-muted-foreground">
                {(data.pagination?.total ?? 0).toLocaleString()} total · page {page} of {data.pagination?.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-1" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1" disabled={page >= (data.pagination?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ContentLayout>
  );
}
