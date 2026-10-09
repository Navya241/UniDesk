"use client";

import * as React from "react";
import Link from "next/link";
import { TicketSummary, SessionUser } from "@/types";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  PlusCircle,
  Clock,
  Building,
  Layers,
  Flame,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default function TicketsListPage() {
  const [currentUser, setCurrentUser] = React.useState<SessionUser | null>(null);
  const [tickets, setTickets] = React.useState<TicketSummary[]>([]);
  const [departments, setDepartments] = React.useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [priority, setPriority] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");

  const fetchTickets = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (priority) params.append("priority", priority);
      if (category) params.append("category", category);
      if (departmentId) params.append("departmentId", departmentId);

      const [ticketsRes, meRes] = await Promise.all([
        fetch(`/api/tickets?${params.toString()}`),
        fetch("/api/auth/me"),
      ]);

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data.tickets || []);
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, status, priority, category, departmentId]);

  React.useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleClaim = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ASSIGN" }),
      });
      if (res.ok) {
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to claim ticket:", err);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setCategory("");
    setDepartmentId("");
  };

  const hasActiveFilters = Boolean(search || status || priority || category || departmentId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Ticket Management Portal
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Browse, search, and track resolution lifecycles across departments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTickets()}
            className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh tickets"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {currentUser && ["STUDENT", "FACULTY", "ADMIN"].includes(currentUser.role) && (
            <Link href="/tickets/new">
              <Button size="sm" variant="primary" className="shadow-sm font-semibold">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                <span>New Ticket</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, number, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full pl-9 pr-3 rounded-xl border border-input bg-background/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full px-3 rounded-xl border border-input bg-background/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="h-10 w-full px-3 rounded-xl border border-input bg-background/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent (Critical)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full px-3 rounded-xl border border-input bg-background/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Categories</option>
              <option value="IT">IT Support</option>
              <option value="HOSTEL">Hostel Department</option>
              <option value="ACADEMICS">Academic Affairs</option>
              <option value="LIBRARY">Library Services</option>
              <option value="ADMINISTRATION">Administration</option>
              <option value="OTHER">General Support</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
            <span className="text-muted-foreground">
              Showing filtered results ({tickets.length} tickets found)
            </span>
            <button
              onClick={clearFilters}
              className="text-primary hover:underline font-semibold"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-xs text-muted-foreground">Loading tickets from database...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-base text-foreground">No tickets match your filters</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try adjusting your search keywords or clear the category and status filters."
              : "No tickets recorded in the system yet."}
          </p>
          {hasActiveFilters && (
            <Button size="sm" variant="outline" onClick={clearFilters} className="mt-2">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {currentUser &&
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                currentUser={currentUser}
                onClaim={handleClaim}
              />
            ))}
        </div>
      )}
    </div>
  );
}
