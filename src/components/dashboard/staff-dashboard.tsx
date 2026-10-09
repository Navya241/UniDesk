"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SessionUser, TicketSummary } from "@/types";
import { TicketCard } from "@/components/tickets/ticket-card";
import {
  Building2,
  Inbox,
  UserCheck,
  Flame,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";

interface StaffDashboardProps {
  user: SessionUser;
  tickets: TicketSummary[];
}

export function StaffDashboard({ user, tickets }: StaffDashboardProps) {
  const router = useRouter();
  const [filterTab, setFilterTab] = React.useState<"ASSIGNED_TO_ME" | "UNASSIGNED" | "URGENT_ESCALATED" | "ALL">("ASSIGNED_TO_ME");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isClaiming, setIsClaiming] = React.useState(false);

  const assignedToMeCount = tickets.filter((t) => t.assignedTo?.id === user.id && t.status !== "CLOSED").length;
  const unassignedCount = tickets.filter((t) => !t.assignedTo && t.status !== "CLOSED").length;
  const urgentOrEscalatedCount = tickets.filter(
    (t) => (t.priority === "URGENT" || t.escalationState === "ESCALATED") && t.status !== "CLOSED"
  ).length;
  const allDeptTicketsCount = tickets.length;

  const handleClaim = async (ticketId: string) => {
    try {
      setIsClaiming(true);
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN",
          assignedToId: user.id,
        }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to claim ticket:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    // Tab filter
    if (filterTab === "ASSIGNED_TO_ME" && ticket.assignedTo?.id !== user.id) return false;
    if (filterTab === "UNASSIGNED" && ticket.assignedTo) return false;
    if (filterTab === "URGENT_ESCALATED" && ticket.priority !== "URGENT" && ticket.escalationState !== "ESCALATED")
      return false;

    // Search query
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        ticket.title.toLowerCase().includes(term) ||
        ticket.ticketNumber.toLowerCase().includes(term) ||
        ticket.description.toLowerCase().includes(term)
      );
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Department Header */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-300">
            <Building2 className="h-3.5 w-3.5" />
            <span>{user.departmentName || "Department"} Support Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Staff Workspace &bull; {user.name}
          </h1>
          <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
            Manage your department ticket queue, claim unassigned requests, update resolution states, and monitor SLA deadlines.
          </p>
        </div>

        <button
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setFilterTab("ASSIGNED_TO_ME")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            filterTab === "ASSIGNED_TO_ME"
              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold">Assigned to Me</span>
            <UserCheck className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{assignedToMeCount}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Active assigned workload</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("UNASSIGNED")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            filterTab === "UNASSIGNED"
              ? "border-purple-500 bg-purple-500/5 shadow-sm ring-1 ring-purple-500"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold">Unassigned Queue</span>
            <Inbox className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
            {unassignedCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Awaiting claim / dispatch</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("URGENT_ESCALATED")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            filterTab === "URGENT_ESCALATED"
              ? "border-rose-500 bg-rose-500/5 shadow-sm ring-1 ring-rose-500"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold">Urgent & Escalated</span>
            <Flame className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {urgentOrEscalatedCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">High SLA breach risk</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("ALL")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            filterTab === "ALL"
              ? "border-blue-500 bg-blue-500/5 shadow-sm ring-1 ring-blue-500"
              : "border-border bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold">Total Department</span>
            <Building2 className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{allDeptTicketsCount}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Cumulative dept tickets</p>
        </button>
      </div>

      {/* Search and Tab Navigation */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setFilterTab("ASSIGNED_TO_ME")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                filterTab === "ASSIGNED_TO_ME"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              My Assigned Work ({assignedToMeCount})
            </button>
            <button
              onClick={() => setFilterTab("UNASSIGNED")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                filterTab === "UNASSIGNED"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Unassigned Queue ({unassignedCount})
            </button>
            <button
              onClick={() => setFilterTab("URGENT_ESCALATED")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                filterTab === "URGENT_ESCALATED"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Urgent & Escalated ({urgentOrEscalatedCount})
            </button>
            <button
              onClick={() => setFilterTab("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                filterTab === "ALL"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All Department ({allDeptTicketsCount})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search department tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full pl-9 pr-3 rounded-xl border border-input bg-card text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Ticket List */}
        {filteredTickets.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-base text-foreground">No tickets in this view</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchTerm
                ? "No department tickets matched your search terms."
                : "The selected queue is currently empty."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                currentUser={user}
                onClaim={handleClaim}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
