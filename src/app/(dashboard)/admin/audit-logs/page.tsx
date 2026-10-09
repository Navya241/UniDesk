"use client";

import * as React from "react";
import { ShieldCheck, Search, Clock, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, formatDate, formatTimeAgo } from "@/lib/utils";
import { Role } from "@/types";

interface HistoryRecord {
  id: string;
  action: string;
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  notes?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    role: Role | string;
    email?: string;
  } | null;
  ticket?: {
    id: string;
    ticketNumber: string;
    title: string;
    isAnonymous: boolean;
  } | null;
}

export default function AdminAuditLogsPage() {
  const [history, setHistory] = React.useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  const fetchLogs = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = history.filter((record) => {
    const term = search.toLowerCase();
    return (
      record.action.toLowerCase().includes(term) ||
      record.notes?.toLowerCase().includes(term) ||
      record.actor?.name.toLowerCase().includes(term) ||
      record.ticket?.ticketNumber.toLowerCase().includes(term) ||
      record.ticket?.title.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <span>System Audit Trail & History</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Immutable log of ticket creations, status transitions, SLA escalations, claims, and comments
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={() => fetchLogs()}>
          <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh Audit Trail
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter by action, actor name, ticket number, or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full pl-10 pr-4 rounded-2xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
        />
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          Loading audit trail records...
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Ticket</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>

                    <td className="p-4">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4">
                      {log.ticket ? (
                        <div>
                          <p className="font-semibold text-foreground">{log.ticket.ticketNumber}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {log.ticket.title}
                          </p>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="p-4">
                      {log.actor ? (
                        <div>
                          <p className="font-semibold text-foreground">{log.actor.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {ROLE_LABELS[log.actor.role as Role] || log.actor.role}
                          </p>
                        </div>
                      ) : (
                        <span className="italic text-slate-500">System Engine</span>
                      )}
                    </td>

                    <td className="p-4 text-muted-foreground max-w-sm leading-relaxed">
                      {log.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
