"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnalyticsData, SessionUser, TicketSummary } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  ShieldAlert,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Users,
  Building2,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminDashboardProps {
  user: SessionUser;
  analytics: AnalyticsData;
  recentTickets: TicketSummary[];
}

export function AdminDashboard({ user, analytics, recentTickets }: AdminDashboardProps) {
  const router = useRouter();
  const [isRunningSLA, setIsRunningSLA] = React.useState(false);
  const [slaMessage, setSlaMessage] = React.useState<string | null>(null);

  const handleRunSLA = async () => {
    try {
      setIsRunningSLA(true);
      setSlaMessage(null);
      const res = await fetch("/api/escalation/check", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSlaMessage(
          `SLA scan complete! Found and escalated ${data.escalatedCount} overdue ticket(s).`
        );
        router.refresh();
      } else {
        setSlaMessage("Failed to execute SLA check.");
      }
    } catch {
      setSlaMessage("An error occurred while running the SLA escalation engine.");
    } finally {
      setIsRunningSLA(false);
    }
  };

  const PIE_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#64748b"];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-300">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Super Administrator Control Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Institutional Operations & Analytics
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Monitor real-time resolution metrics, department workloads, recurring campus issues, and enforce SLA escalation thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            onClick={handleRunSLA}
            isLoading={isRunningSLA}
            className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold shadow-lg shadow-rose-600/20 text-xs"
          >
            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
            <span>Run SLA Check Now</span>
          </Button>

          <Link href="/tickets">
            <Button variant="outline" className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 text-xs">
              All Tickets Master List
            </Button>
          </Link>
        </div>
      </div>

      {slaMessage && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>{slaMessage}</span>
          </div>
          <button
            onClick={() => setSlaMessage(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Total Tickets</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
            {analytics.totalTickets}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Database Total</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Open / In Progress</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {analytics.openTickets + analytics.inProgressTickets}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Active Queue</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Resolved / Closed</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {analytics.resolvedTickets + analytics.closedTickets}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Resolved Issues</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Resolution Rate</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {analytics.resolutionRate}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Resolved / Total</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">Avg Resolution</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {analytics.avgResolutionHours}h
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Resolved duration</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground">SLA Escalations</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {analytics.escalatedTickets}
          </p>
          <p className="text-[10px] text-rose-500 font-medium mt-0.5">Overdue Breaches</p>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload Distribution */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Department Workload Volume
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Active ticket distribution across campus departments
            </p>
          </div>

          <div className="h-64 w-full mt-4 flex items-center justify-center">
            {analytics.ticketsByDepartment.length === 0 || analytics.totalTickets === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                <Building2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-foreground">No Department Data</p>
                <p className="text-[11px] mt-1">Submitted tickets will populate department workloads here.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.ticketsByDepartment} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid #334155",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Tickets" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 7-Day Trend: Created vs Resolved */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              7-Day Inflow vs Resolution Trend
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Velocity of new tickets created vs tickets successfully resolved
            </p>
          </div>

          <div className="h-64 w-full mt-4 flex items-center justify-center">
            {analytics.totalTickets === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-foreground">No Trend Data</p>
                <p className="text-[11px] mt-1">Inflow and resolution velocity will appear over time.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.ticketTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "12px",
                      border: "1px solid #334155",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="created" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCreated)" name="Created" />
                  <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Analytics: Category Distribution & Recurring Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (Pie) */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-500" />
              Tickets by Category
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Classification split</p>
          </div>

          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.ticketsByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {analytics.ticketsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    borderRadius: "12px",
                    border: "1px solid #334155",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1 pt-2 border-t border-border/70 text-[11px]">
            {analytics.ticketsByCategory.map((entry, idx) => (
              <div key={entry.category} className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="truncate">{entry.label}:</span>
                <span className="font-bold text-foreground">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Priority Distribution
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Urgency classification</p>
          </div>

          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.ticketsByPriority} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="priority" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    borderRadius: "12px",
                    border: "1px solid #334155",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Count">
                  {analytics.ticketsByPriority.map((entry) => (
                    <Cell key={entry.priority} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-border/70 flex justify-between text-xs text-muted-foreground">
            <span>Critical Load:</span>
            <span className="font-bold text-rose-600">
              {analytics.ticketsByPriority.find((p) => p.priority === "URGENT")?.count || 0} Urgent
            </span>
          </div>
        </div>

        {/* Recurring Issues Keyword Frequency */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Recurring Issue Hotspots
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Top repeated keyword tokens</p>
          </div>

          <div className="space-y-2 mt-3 overflow-y-auto max-h-56 pr-1">
            {analytics.recurringKeywords.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No recurring tokens detected yet.</p>
            ) : (
              analytics.recurringKeywords.map((item, idx) => (
                <div
                  key={item.word}
                  className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/50 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground w-4">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-foreground capitalize">
                      {item.word}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                      {item.category}
                    </span>
                  </div>
                  <span className="font-bold text-primary bg-background px-2 py-0.5 rounded-md border border-border shadow-xs">
                    {item.count} hits
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-border/70 text-right">
            <Link href="/admin/analytics" className="text-xs font-semibold text-primary hover:underline">
              Detailed Analytics Page &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
