import { prisma } from "@/lib/prisma";
import { AnalyticsData, TicketCategory } from "@/types";
import { CATEGORY_LABELS } from "@/lib/utils";

const STOP_WORDS = new Set([
  "the", "and", "a", "an", "is", "in", "it", "to", "for", "of", "with", "on", "at",
  "from", "by", "about", "as", "into", "like", "through", "after", "over", "between",
  "out", "against", "during", "without", "before", "under", "around", "among", "this",
  "that", "these", "those", "was", "were", "been", "have", "has", "had", "not", "but",
  "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no",
  "nor", "too", "very", "can", "will", "just", "should", "now", "issue", "problem", "ticket"
]);

export async function getAnalyticsMetrics(): Promise<AnalyticsData> {
  const tickets = await prisma.ticket.findMany({
    include: {
      department: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const totalTickets = tickets.length;
  let openTickets = 0;
  let inProgressTickets = 0;
  let resolvedTickets = 0;
  let closedTickets = 0;
  let escalatedTickets = 0;

  let totalResolutionTimeMs = 0;
  let resolvedCount = 0;

  const categoryCounts: Record<string, number> = {
    HOSTEL: 0,
    ACADEMICS: 0,
    IT: 0,
    LIBRARY: 0,
    ADMINISTRATION: 0,
    OTHER: 0,
  };

  const priorityCounts: Record<string, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    URGENT: 0,
  };

  const statusCounts: Record<string, number> = {
    SUBMITTED: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
  };

  const departmentCounts: Record<string, { count: number; name: string; code: string }> = {};

  // For Recurring issues extraction
  const wordFrequency: Record<string, { count: number; categories: Record<string, number> }> = {};

  // For 7-day trend
  const trendMap: Record<string, { created: number; resolved: number }> = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    trendMap[dateKey] = { created: 0, resolved: 0 };
  }

  for (const t of tickets) {
    // Status counts
    if (["SUBMITTED", "ASSIGNED"].includes(t.status)) openTickets++;
    if (t.status === "IN_PROGRESS") inProgressTickets++;
    if (t.status === "RESOLVED") resolvedTickets++;
    if (t.status === "CLOSED") closedTickets++;
    if (t.escalationState === "ESCALATED") escalatedTickets++;

    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;

    // Dept counts
    const deptKey = t.department.id;
    if (!departmentCounts[deptKey]) {
      departmentCounts[deptKey] = {
        count: 0,
        name: t.department.name,
        code: t.department.code,
      };
    }
    departmentCounts[deptKey].count++;

    // Resolution time calculation (resolved tickets only)
    if (t.resolvedAt) {
      const durationMs = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
      if (durationMs > 0) {
        totalResolutionTimeMs += durationMs;
        resolvedCount++;
      }
    }

    // Trend grouping
    const createdDateKey = new Date(t.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (trendMap[createdDateKey]) {
      trendMap[createdDateKey].created++;
    }

    if (t.resolvedAt) {
      const resolvedDateKey = new Date(t.resolvedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (trendMap[resolvedDateKey]) {
        trendMap[resolvedDateKey].resolved++;
      }
    }

    // Keyword extraction for recurring issues
    const textContent = `${t.title} ${t.description}`.toLowerCase();
    const tokens = textContent.split(/[^a-z0-9]+/);
    for (const token of tokens) {
      if (token.length >= 3 && !STOP_WORDS.has(token)) {
        if (!wordFrequency[token]) {
          wordFrequency[token] = { count: 0, categories: {} };
        }
        wordFrequency[token].count++;
        wordFrequency[token].categories[t.category] =
          (wordFrequency[token].categories[t.category] || 0) + 1;
      }
    }
  }

  // Calculate resolution rate
  const resolvedAndClosed = resolvedTickets + closedTickets;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedAndClosed / totalTickets) * 100) : 0;

  // Calculate avg resolution time in hours
  const avgResolutionHours =
    resolvedCount > 0 ? parseFloat((totalResolutionTimeMs / (resolvedCount * 1000 * 3600)).toFixed(1)) : 0;

  // Format category distribution
  const ticketsByCategory = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: cat,
    label: CATEGORY_LABELS[cat as TicketCategory] || cat,
    count,
  }));

  // Format priority distribution
  const priorityColors: Record<string, string> = {
    LOW: "#64748b",
    MEDIUM: "#3b82f6",
    HIGH: "#f97316",
    URGENT: "#ef4444",
  };
  const ticketsByPriority = Object.entries(priorityCounts).map(([prio, count]) => ({
    priority: prio,
    count,
    color: priorityColors[prio] || "#64748b",
  }));

  // Format department workload
  const ticketsByDepartment = Object.values(departmentCounts).map((dept) => ({
    department: dept.name,
    code: dept.code,
    count: dept.count,
  }));

  // Format trends
  const ticketTrends = Object.entries(trendMap).map(([date, counts]) => ({
    date,
    created: counts.created,
    resolved: counts.resolved,
  }));

  // Format recurring keywords (top 8)
  const recurringKeywords = Object.entries(wordFrequency)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([word, data]) => {
      // Find top category for this word
      const topCategory = Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "GENERAL";
      return {
        word,
        count: data.count,
        category: topCategory,
      };
    });

  return {
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    closedTickets,
    escalatedTickets,
    resolutionRate,
    avgResolutionHours,
    ticketsByCategory,
    ticketsByPriority,
    ticketsByDepartment,
    ticketsByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    ticketTrends,
    recurringKeywords,
  };
}
