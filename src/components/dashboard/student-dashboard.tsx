"use client";

import * as React from "react";
import Link from "next/link";
import { SessionUser, TicketSummary } from "@/types";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Search,
} from "lucide-react";

interface StudentDashboardProps {
  user: SessionUser;
  tickets: TicketSummary[];
  faqs: Array<{ id: string; question: string; answer: string; category: string }>;
}

export function StudentDashboard({ user, tickets, faqs }: StudentDashboardProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  const total = tickets.length;
  const openCount = tickets.filter((t) => ["SUBMITTED", "ASSIGNED"].includes(t.status)).length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;
  const closedCount = tickets.filter((t) => t.status === "CLOSED").length;

  const filteredTickets = tickets.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-6 sm:p-8 shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-blue-100">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{user.role === "FACULTY" ? "Faculty Helpdesk Portal" : "Student Support Center"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.name} 👋
          </h1>
          <p className="text-blue-100 text-sm max-w-xl leading-relaxed">
            Submit grievance tickets, track resolution progress with departments, or browse quick answers in the campus FAQ database.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/tickets/new">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg shadow-black/10"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              <span>Create New Ticket</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold">Total Submitted</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{total}</p>
          <p className="text-[11px] text-muted-foreground mt-1">All time tickets</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold">Active & In Queue</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {openCount + inProgressCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Pending department action</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {resolvedCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Ready for confirmation</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold">Closed</span>
            <CheckCircle2 className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-600 dark:text-slate-300">
            {closedCount}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">Completed & archived</p>
        </div>
      </div>

      {/* Main Content Grid: Tickets List & FAQs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tickets Feed (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">My Support Tickets</h2>
              <p className="text-xs text-muted-foreground">Track resolution status & communicate with staff</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search my tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full pl-9 pr-3 rounded-xl border border-input bg-card text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-base text-foreground">No tickets found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchTerm
                  ? "No tickets matched your search query."
                  : "You haven't reported any issues yet. Click below to create your first ticket."}
              </p>
              {!searchTerm && (
                <Link href="/tickets/new">
                  <Button size="sm" variant="primary" className="mt-2">
                    <PlusCircle className="h-4 w-4 mr-1.5" />
                    Submit a Ticket
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} currentUser={user} />
              ))}
            </div>
          )}
        </div>

        {/* Quick FAQ Widget (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              Frequently Asked Questions
            </h3>
            <Link href="/faqs" className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 divide-y divide-border/60">
            {faqs.slice(0, 4).map((faq) => (
              <details key={faq.id} className="group py-3 first:pt-0 last:pb-0 cursor-pointer">
                <summary className="text-xs font-semibold text-foreground group-open:text-primary flex items-center justify-between list-none">
                  <span>{faq.question}</span>
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform text-xs">
                    ▼
                  </span>
                </summary>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed pl-2 border-l-2 border-primary/40">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          {/* Anonymous Reporting Info Card */}
          <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <Sparkles className="h-4 w-4" />
              Grievance & Anonymous Mode
            </p>
            <p className="leading-relaxed">
              When reporting sensitive issues (e.g., hostel mess hygiene or harassment), you can enable <strong>Anonymous Reporting</strong>. Your identity is scrubbed before reaching department staff.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
