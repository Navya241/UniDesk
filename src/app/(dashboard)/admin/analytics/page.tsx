import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getAnalyticsMetrics } from "@/lib/analytics";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { prisma } from "@/lib/prisma";

export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const analytics = await getAnalyticsMetrics();
  const rawTickets = await prisma.ticket.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      department: true,
      assignedTo: true,
      reporter: true,
      _count: { select: { comments: true, attachments: true } },
    },
  });

  const recentTickets = rawTickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    title: t.title,
    description: t.description,
    category: t.category as any,
    priority: t.priority as any,
    status: t.status as any,
    isAnonymous: t.isAnonymous,
    reporter: { id: t.reporter.id, name: t.reporter.name, role: t.reporter.role as any },
    department: { id: t.department.id, name: t.department.name, code: t.department.code },
    assignedTo: t.assignedTo ? { id: t.assignedTo.id, name: t.assignedTo.name } : null,
    dueAt: t.dueAt.toISOString(),
    escalationState: t.escalationState as any,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    _count: t._count,
  }));

  return (
    <div className="space-y-6">
      <AdminDashboard user={user} analytics={analytics} recentTickets={recentTickets} />
    </div>
  );
}
