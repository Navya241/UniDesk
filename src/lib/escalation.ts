import { prisma } from "@/lib/prisma";
import { TicketCategory, TicketPriority } from "@/types";
import { notifyDepartmentStaff, notifyAdmins } from "@/lib/notifications";

export const DEFAULT_SLA_HOURS: Record<TicketPriority, number> = {
  URGENT: 12,
  HIGH: 24,
  MEDIUM: 48,
  LOW: 72,
};

export async function calculateDueTimestamp(
  category: TicketCategory,
  priority: TicketPriority
): Promise<Date> {
  const config = await prisma.escalationConfig.findUnique({
    where: { category },
  });

  let hours = DEFAULT_SLA_HOURS[priority] || 48;
  if (config) {
    switch (priority) {
      case "URGENT":
        hours = config.urgentHours;
        break;
      case "HIGH":
        hours = config.highHours;
        break;
      case "MEDIUM":
        hours = config.mediumHours;
        break;
      case "LOW":
        hours = config.lowHours;
        break;
    }
  }

  const dueDate = new Date();
  dueDate.setHours(dueDate.getHours() + hours);
  return dueDate;
}

export async function runEscalationCheck() {
  const now = new Date();

  // Find all unresolved tickets whose dueAt is past and are not yet ESCALATED
  const overdueTickets = await prisma.ticket.findMany({
    where: {
      status: { in: ["SUBMITTED", "ASSIGNED", "IN_PROGRESS"] },
      dueAt: { lte: now },
      escalationState: { not: "ESCALATED" },
    },
    include: {
      department: true,
      assignedTo: true,
      reporter: true,
    },
  });

  const escalatedResults: Array<{ id: string; ticketNumber: string; title: string }> = [];

  for (const ticket of overdueTickets) {
    // 1. Update ticket escalation state
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        escalationState: "ESCALATED",
      },
    });

    // 2. Create history entry
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        action: "ESCALATED",
        fieldChanged: "escalationState",
        oldValue: ticket.escalationState,
        newValue: "ESCALATED",
        notes: `Automated SLA Escalation: Ticket resolution deadline (${ticket.dueAt.toISOString()}) has elapsed.`,
      },
    });

    // 3. Notify department staff
    await notifyDepartmentStaff(ticket.departmentId, {
      ticketId: ticket.id,
      title: `🚨 Escalation Alert: ${ticket.ticketNumber}`,
      message: `Ticket "${ticket.title}" has breached its SLA deadline and is now ESCALATED.`,
      type: "ESCALATED",
    });

    // 4. Notify admins
    await notifyAdmins({
      ticketId: ticket.id,
      title: `🚨 System Escalation: ${ticket.ticketNumber}`,
      message: `Overdue ticket "${ticket.title}" in department ${ticket.department.name} has been escalated.`,
      type: "ESCALATED",
    });

    escalatedResults.push({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
    });
  }

  return {
    checkedAt: now,
    escalatedCount: escalatedResults.length,
    escalatedTickets: escalatedResults,
  };
}
