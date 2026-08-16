"use client";

import { useState } from "react";
import { ContentLayout } from "@/components/content-layout";
import { formatServerName } from "@/components/format-server-name";
import { useSession } from "@/hooks/use-session";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Search, Filter, X, BarChart3, Eye, Calendar, Clock, ShieldAlert } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, subHours, startOfHour, endOfHour } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { ModelHoverCard } from "@/components/model-hover-card";
import { getModelByHash, getModelByName } from "@/lib/models-data";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/utils";
import type { Permission } from "@vexonac/database";
import { useMemo } from "react";

// Log type options for filtering
const SYSTEM_LOG_TYPES = [
  { value: "SERVER_START", label: "Server Start" },
  { value: "SERVER_RENAME", label: "Server Rename" },
  { value: "MEMBER_ADD", label: "Member Add" },
  { value: "MEMBER_REMOVE", label: "Member Remove" },
  { value: "CONFIG_UPDATE", label: "Config Update" },
  { value: "DOWNLOAD", label: "Download" },
];

const SERVER_LOG_TYPES = [
  { value: "PLAYER_JOIN", label: "Player Join", color: "#10b981" },
  { value: "PLAYER_LEAVE", label: "Player Leave", color: "#f59e0b" },
  { value: "BAN_PLAYER", label: "Ban Player", color: "#ef4444" },
  { value: "UNBAN_PLAYER", label: "Unban Player", color: "#9333ea" },
  { value: "KICK_PLAYER", label: "Kick Player", color: "#f97316" },
  { value: "ENTITY_CREATE", label: "Entity Create", color: "#ec4899" },
  { value: "KILL", label: "Kill", color: "#8b5cf6" },
  { value: "EXPLOSION", label: "Explosion", color: "#b91c1c" },
];



function LogTypeFilter({
  title,
  options,
  selectedValues,
  onValueChange,
}: {
  title: string;
  options: { value: string; label: string; color?: string }[];
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Filter className="mr-2 h-3 w-3" />
          {title}
          {selectedValues.length > 0 && (
            <>
              <div className="ml-2 h-4 w-px bg-border" />
              <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs font-normal">
                {selectedValues.length}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    const isSelected = selectedValues.includes(option.value);
                    if (isSelected) {
                      onValueChange(selectedValues.filter((v) => v !== option.value));
                    } else {
                      onValueChange([...selectedValues, option.value]);
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    checked={selectedValues.includes(option.value)}
                    className="h-4 w-4"
                  />
                  {option.color && (
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span className="flex-1">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to get log type color
function getLogTypeColor(type: string, isSystem: boolean): string {
  if (isSystem) {
    return "#6b7280"; // Gray for system logs
  }
  return SERVER_LOG_TYPES.find(t => t.value === type)?.color || "#6b7280";
}

// Helper function to format details in a readable way
function formatLogDetails(details: any, logType: string): React.ReactNode {
  if (!details || Object.keys(details).length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  const formatValue = (key: string, value: any): React.ReactNode => {
    const stringValue = String(value);
    
    // Check if this might be a model name and if it exists in our model data
    const modelKeys = [
      'pedModel',
      'entityModel', 
      'vehicleModel',
      'objectModel',
      'weapon',
      'weaponHash',
      'weaponType',
      'spoofedWeapon',
      'selectedClientWeapon',
      'selectedServerWeapon',
      'explosionType',
      'explosionName'
    ];
    if (modelKeys.includes(key)) {
      const model = getModelByName(stringValue) || getModelByHash(stringValue);
      if (model) {
        return (
          <ModelHoverCard modelName={stringValue}>
            <span className="text-violet-600 hover:text-violet-800 cursor-pointer underline decoration-dotted">
              {stringValue}
            </span>
          </ModelHoverCard>
        );
      }
    }
    
    return stringValue;
  };

  return (
    <div className="space-y-1">
      {Object.entries(details).map(([key, value]) => (
        <div key={key} className="flex items-start space-x-2 text-xs">
          <span className="text-muted-foreground font-medium min-w-0 flex-shrink-0 capitalize">
            {key}:
          </span>
          <span className="text-foreground break-all">
            {formatValue(key, value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ServerLogs() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;
  const { data: session } = useSession();

  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [systemTypes, setSystemTypes] = useState<string[]>([]);
  const [serverTypes, setServerTypes] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Fetch server data
  const { data: server, isLoading: serverLoading } = useQuery(
    trpc.servers.getServer.queryOptions(serverId, {
      enabled: !!session?.user,
      staleTime: 30000,
    })
  );

  // Fetch logs data
  const {
    data: logsData,
    isLoading: logsLoading,
  } = useQuery(
    trpc.servers.getLogs.queryOptions(
      {
        serverId,
        page,
        limit: 20,
        search: search || undefined,
        systemTypes: systemTypes.length > 0 ? systemTypes as any : undefined,
        serverTypes: serverTypes.length > 0 ? serverTypes as any : undefined,
        dateFrom: dateFrom?.toISOString(),
        dateTo: dateTo?.toISOString(),
      },
      {
        enabled: !!session?.user && !!server,
        staleTime: 10000,
      }
    )
  );

  // Fetch logs analytics
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
  } = useQuery(
    trpc.servers.getLogsAnalytics.queryOptions(
      {
        serverId,
        timeRange,
      },
      {
        enabled: !!session?.user && !!server,
        staleTime: 30000,
      }
    )
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
  const hasViewLogsPermission = hasPermission(server?.permissions, "VIEW_LOGS");
  const canViewLogs = isOwner || hasViewLogsPermission;

  // Get logs and analytics data
  const logs = (logsData?.logs as any[]) || [];
  const pagination = logsData?.pagination;
  const chartData = (analyticsData?.chartData as any[]) || [];
  
  // Pagination info
  const totalPages = pagination?.totalPages || 1;
  const filteredLogsCount = pagination?.totalCount || 0;
  const startIndex = ((pagination?.page || 1) - 1) * (pagination?.limit || 20);

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setSystemTypes([]);
    setServerTypes([]);
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(1);
  };

    const hasFilters = search || systemTypes.length > 0 || serverTypes.length > 0 || dateFrom || dateTo;

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

  if (!canViewLogs) {
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
              You don't have permission to view logs. Contact the server owner to get the VIEW_LOGS permission.
            </CardDescription>
          </CardHeader>
        </Card>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout
      title={formatServerName(server?.serverName || "Server Logs")}
      breadcrumb={{ title: "Dashboard", url: `/dashboard/server/${serverId}` }}
    >
      <div className="space-y-4 md:space-y-6">
        {/* Analytics Chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Server Event Logs
                </CardTitle>
                <CardDescription>
                  Activity breakdown by event type over time
                </CardDescription>
              </div>
              <div className="flex items-center bg-muted/50 p-1 rounded-lg">
                <Button
                  variant={timeRange === "today" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange("today")}
                  className="px-3 py-1 h-7 text-xs"
                >
                  Today
                </Button>
                <Button
                  variant={timeRange === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange("week")}
                  className="px-3 py-1 h-7 text-xs"
                >
                  7 days
                </Button>
                <Button
                  variant={timeRange === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange("month")}
                  className="px-3 py-1 h-7 text-xs"
                >
                  30 days
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {analyticsLoading ? (
              <Skeleton className="h-[250px] sm:h-[300px] w-full" />
            ) : (
              <ChartContainer
                className="aspect-auto h-[250px] sm:h-[300px] w-full"
                config={{
                  PLAYER_JOIN: { label: "Player Join", color: "#10b981" },
                  PLAYER_LEAVE: { label: "Player Leave", color: "#f59e0b" },
                  BAN_PLAYER: { label: "Ban Player", color: "#ef4444" },
                  UNBAN_PLAYER: { label: "Unban Player", color: "#9333ea" },
                  KICK_PLAYER: { label: "Kick Player", color: "#f97316" },
                  ENTITY_CREATE: { label: "Entity Create", color: "#ec4899" },
                  KILL: { label: "Kill", color: "#8b5cf6" },
                  EXPLOSION: { label: "Explosion", color: "#b91c1c" },
                }}
              >
                                  <AreaChart data={chartData} margin={{ left: -20 }}>
                    <defs>
                      {SERVER_LOG_TYPES.map((type) => (
                        <linearGradient key={type.value} id={`color${type.value}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={`var(--color-${type.value})`} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={`var(--color-${type.value})`} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip
                      labelFormatter={(label) => `Time: ${label}`}
                      content={<ChartTooltipContent />}
                    />
                    {["PLAYER_JOIN", "PLAYER_LEAVE", "BAN_PLAYER", "UNBAN_PLAYER", "KICK_PLAYER", "ENTITY_CREATE", "KILL", "EXPLOSION"].map((type) => (
                      <Area
                        key={type}
                        type="monotone"
                        dataKey={type}
                        stackId="1"
                        stroke={`var(--color-${type})`}
                        fill={`url(#color${type})`}
                        fillOpacity={0.6}
                      />
                    ))}
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by player name, ID, license, or details..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              
              {/* Compact Filters Row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Date Range */}
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        <Calendar className="mr-1 h-3 w-3" />
                        {dateFrom ? format(dateFrom, "MMM dd") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        <Calendar className="mr-1 h-3 w-3" />
                        {dateTo ? format(dateTo, "MMM dd") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Event Type Filters */}
                <LogTypeFilter
                  title="System Events"
                  options={SYSTEM_LOG_TYPES}
                  selectedValues={systemTypes}
                  onValueChange={setSystemTypes}
                />
                <LogTypeFilter
                  title="Server Events"
                  options={SERVER_LOG_TYPES}
                  selectedValues={serverTypes}
                  onValueChange={setServerTypes}
                />
                
                {hasFilters && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 text-xs"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Server Logs
            </CardTitle>
            <CardDescription>
              {filteredLogsCount} total logs
              {hasFilters && " (filtered)"}
            </CardDescription>
          </CardHeader>
                      <CardContent>
              <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Time</TableHead>
                        <TableHead className="w-[140px]">Type</TableHead>
                        <TableHead className="min-w-[180px]">Player</TableHead>
                        <TableHead className="max-w-[300px]">Details</TableHead>
                        <TableHead className="w-[120px]">Member</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    {logsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log: any) => {
                        const type = log.systemType || log.serverType;
                        const isSystem = !!log.systemType;
                        
                        return (
                      <TableRow key={log.id}>
                        <TableCell className="w-[120px]">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {format(new Date(log.createdAt), "HH:mm:ss")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.createdAt), "MMM dd")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="w-[140px]">
                          <Badge 
                            className="font-mono text-xs border-0" 
                            style={{ 
                              backgroundColor: getLogTypeColor(type!, isSystem),
                              color: 'white'
                            }}
                          >
                            {type}
                          </Badge>
                        </TableCell>
                                                <TableCell className="min-w-[180px] max-w-[200px]">
                          {log.playerName ? (
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="font-medium truncate text-sm">{log.playerName}</span>
                              {log.playerLicense && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 flex-shrink-0 hover:bg-muted"
                                  onClick={() => router.push(`/dashboard/server/${serverId}/lookup?license=${encodeURIComponent(log.playerLicense!)}`)}
                                  title="View player details"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="max-w-[280px] overflow-hidden">
                            {formatLogDetails(log.details, type!)}
                          </div>
                        </TableCell>
                        <TableCell className="w-[120px]">
                          {log.memberId ? (
                            <span className="font-mono text-xs text-muted-foreground">{log.memberId}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                        );
                      })
                    )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            
            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(startIndex + (pagination?.limit || 20), filteredLogsCount)} of {filteredLogsCount} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
}
