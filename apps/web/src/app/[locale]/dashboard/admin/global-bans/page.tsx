"use client";

import { ContentLayout } from "@/components/content-layout";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe,
  RefreshCw,
  Server,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type BanStatus = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

const STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  APPROVED: "bg-green-500/10  text-green-400  border-green-500/30",
  REJECTED: "bg-red-500/10   text-red-400    border-red-500/30",
};

const TAB_OPTS: { label: string; value: BanStatus }[] = [
  { label: "Pending Review", value: "PENDING" },
  { label: "Approved",       value: "APPROVED" },
  { label: "Rejected",       value: "REJECTED" },
  { label: "All",            value: "ALL" },
];

export default function GlobalBansPage() {
  const [status, setStatus] = useState<BanStatus>("PENDING");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery(
    trpc.admin.listGlobalBans.queryOptions({ status, page, limit: 25 })
  );

  const { mutate: approve, isPending: approving } = useMutation(
    trpc.admin.approveGlobalBan.mutationOptions({
      onSuccess: () => { toast.success("Ban approved — now blocks players on all VexonAC servers"); refetch(); },
      onError:   () => toast.error("Failed to approve ban"),
    })
  );

  const { mutate: reject, isPending: rejecting } = useMutation(
    trpc.admin.rejectGlobalBan.mutationOptions({
      onSuccess: () => { toast.success("Ban rejected"); refetch(); },
      onError:   () => toast.error("Failed to reject ban"),
    })
  );

  const { mutate: deleteBan, isPending: deleting } = useMutation(
    trpc.admin.deleteGlobalBan.mutationOptions({
      onSuccess: () => { toast.success("Ban record deleted"); refetch(); },
      onError:   () => toast.error("Failed to delete ban"),
    })
  );

  const bans  = data?.bans  ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <ContentLayout title="Global Bans">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Global Ban Database
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bans submitted from all VexonAC servers. Approved bans block players network-wide.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 border-b border-border">
          {TAB_OPTS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setStatus(t.value); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                status === t.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : bans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10" />
              <p className="text-sm">No {status === "ALL" ? "" : status.toLowerCase()} bans</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Player</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reason</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Server</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(bans as any[]).map((ban: any) => (
                    <tr key={ban.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{ban.playerName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                          {(ban.identifiers as string[]).slice(0, 3).map((id: string) => (
                            <div key={id} className="font-mono truncate max-w-[200px]">{id}</div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="text-muted-foreground">{ban.reason}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Server className="h-3.5 w-3.5" />
                          <span>{ban.sourceServer ?? "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[ban.status] ?? ""}`}>
                          {ban.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(ban.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {ban.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => approve(ban.id)}
                                disabled={approving}
                                title="Approve — blocks player globally"
                                className="flex items-center gap-1 rounded-lg bg-green-600/10 border border-green-600/30 px-2 py-1.5 text-green-400 hover:bg-green-600/20 transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span className="text-xs">Approve</span>
                              </button>
                              <button
                                onClick={() => reject(ban.id)}
                                disabled={rejecting}
                                title="Reject"
                                className="flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/30 px-2 py-1.5 text-red-400 hover:bg-red-500/20 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span className="text-xs">Reject</span>
                              </button>
                            </>
                          )}
                          {ban.status === "APPROVED" && (
                            <button
                              onClick={() => reject(ban.id)}
                              disabled={rejecting}
                              title="Revoke approval"
                              className="flex items-center gap-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-2 py-1.5 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span className="text-xs">Revoke</span>
                            </button>
                          )}
                          <button
                            onClick={() => deleteBan(ban.id)}
                            disabled={deleting}
                            title="Delete record"
                            className="rounded-lg bg-muted p-1.5 text-muted-foreground hover:bg-muted/80 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
            <span>{total} total records</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-border p-1.5 hover:bg-accent disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>Page {page} of {pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="rounded-lg border border-border p-1.5 hover:bg-accent disabled:opacity-40"
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
