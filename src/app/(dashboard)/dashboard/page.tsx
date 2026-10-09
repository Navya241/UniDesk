import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnalyticsMetrics } from "@/lib/analytics";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { StaffDashboard } from "@/components/dashboard/staff-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TicketCategory, TicketPriority, TicketStatus, EscalationState, TicketSummary } from "@/types";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // 1. If Admin: load live analytics & all recent tickets
  if (user.role === "ADMIN") {
    const analytics = await getAnalyticsMetrics();
    const rawTickets = await prisma.ticket.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        department: true,
        assignedTo: true,
        reporter: true,
        _count: {
          select: { comments: true, attachments: true },
        },
      },
    });

    const recentTickets: TicketSummary[] = rawTickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      description: t.description,
      category: t.category as TicketCategory,
      priority: t.priority as TicketPriority,
      status: t.status as TicketStatus,
      isAnonymous: t.isAnonymous,
      reporter: t.isAnonymous
        ? undefined
        : {
            id: t.reporter.id,
            name: t.reporter.name,
            email: t.reporter.email,
            role: t.reporter.role as any,
          },
      department: {
        id: t.department.id,
        name: t.department.name,
        code: t.department.code,
      },
      assignedTo: t.assignedTo
        ? {
            id: t.assignedTo.id,
            name: t.assignedTo.name,
            email: t.assignedTo.email,
          }
        : null,
      dueAt: t.dueAt.toISOString(),
      escalationState: t.escalationState as EscalationState,
      resolvedAt: t.resolvedAt?.toISOString(),
      closedAt: t.closedAt?.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      _count: t._count,
    }));

    return (
      <AdminDashboard
        user={user}
        analytics={analytics}
        recentTickets={recentTickets}
      />
    );
  }

  // 2. If Department Staff: load tickets belonging to their department
  if (user.role === "DEPARTMENT_STAFF") {
    const rawTickets = await prisma.ticket.findMany({
      where: user.departmentId ? { departmentId: user.departmentId } : {},
      orderBy: { createdAt: "desc" },
      include: {
        department: true,
        assignedTo: true,
        reporter: true,
        _count: {
          select: { comments: true, attachments: true },
        },
      },
    });

    const deptTickets: TicketSummary[] = rawTickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      description: t.description,
      category: t.category as TicketCategory,
      priority: t.priority as TicketPriority,
      status: t.status as TicketStatus,
      isAnonymous: t.isAnonymous,
      // Anonymity Protection: redact reporter info for department staff if anonymous
      reporter: t.isAnonymous
        ? undefined
        : {
            id: t.reporter.id,
            name: t.reporter.name,
            role: t.reporter.role as any,
          },
      department: {
        id: t.department.id,
        name: t.department.name,
        code: t.department.code,
      },
      assignedTo: t.assignedTo
        ? {
            id: t.assignedTo.id,
            name: t.assignedTo.name,
          }
        : null,
      dueAt: t.dueAt.toISOString(),
      escalationState: t.escalationState as EscalationState,
      resolvedAt: t.resolvedAt?.toISOString(),
      closedAt: t.closedAt?.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      _count: t._count,
    }));

    return <StaffDashboard user={user} tickets={deptTickets} />;
  }

  // 3. If Student or Faculty: load their own reported tickets & FAQs
  const rawTickets = await prisma.ticket.findMany({
    where: { reporterId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      department: true,
      assignedTo: true,
      reporter: true,
      _count: {
        select: { comments: true, attachments: true },
      },
    },
  });

  const faqs = await prisma.fAQ.findMany({
    where: { isPublished: true },
    take: 6,
    orderBy: { order: "asc" },
    select: { id: true, question: true, answer: true, category: true },
  });

  const userTickets: TicketSummary[] = rawTickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    title: t.title,
    description: t.description,
    category: t.category as TicketCategory,
    priority: t.priority as TicketPriority,
    status: t.status as TicketStatus,
    isAnonymous: t.isAnonymous,
    reporter: {
      id: t.reporter.id,
      name: t.reporter.name,
      role: t.reporter.role as any,
    },
    department: {
      id: t.department.id,
      name: t.department.name,
      code: t.department.code,
    },
    assignedTo: t.assignedTo
      ? {
          id: t.assignedTo.id,
          name: t.assignedTo.name,
        }
      : null,
    dueAt: t.dueAt.toISOString(),
    escalationState: t.escalationState as EscalationState,
    resolvedAt: t.resolvedAt?.toISOString(),
    closedAt: t.closedAt?.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    _count: t._count,
  }));

  return <StudentDashboard user={user} tickets={userTickets} faqs={faqs} />;
}
