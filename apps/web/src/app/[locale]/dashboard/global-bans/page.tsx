"use client";

import { ContentLayout } from "@/components/content-layout";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  RefreshCw,
  Server,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

export default function PublicGlobalBansPage() {
  const [page, setPage] = useState(1);
  const { data: session } = useSession();

  const { data, isLoading, refetch } = useQuery(
    trpc.globalBans.list.queryOptions(
      { page, limit: 25 },
      { enabled: !!session },
    ),
  );

  const bans  = data?.bans  ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <ContentLayout title="Global Ban Database">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Global Ban Database
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Players banned across all VexonAC-protected servers. Approved bans block players network-wide.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
          <ShieldCheck className="h-4 w-4 text-green-400" />
          <span className="text-muted-foreground">
            <strong className="text-foreground">{total.toLocaleString()}</strong> approved bans protecting the VexonAC network
          </span>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : bans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Globe className="h-10 w-10 opacity-30" />
              <p className="text-sm">No approved global bans yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Player</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reported By</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(bans as any[]).map((ban: any) => (
                    <tr key={ban.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{ban.playerName}</div>
                      </td>
                      <td className="px-4 py-3 max-w-[260px]">
                        <span className="text-muted-foreground">{ban.reason}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Server className="h-3.5 w-3.5 shrink-0" />
                          <span>{ban.sourceServer ?? "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(ban.createdAt), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{total.toLocaleString()} total bans</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-border p-1.5 hover:bg-accent disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>Page {page} of {pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="rounded-lg border border-border p-1.5 hover:bg-accent disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </ContentLayout>
  );
}
