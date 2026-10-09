import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDepartmentForCategory } from "@/lib/routing";
import { calculateDueTimestamp } from "@/lib/escalation";

describe("Auth and Ticket Lifecycle Integration", () => {
  it("hashes and verifies passwords accurately with bcrypt", async () => {
    const rawPass = "UniDesk@SecurePass2026";
    const hash = await hashPassword(rawPass);

    expect(hash).not.toBe(rawPass);
    const isValid = await verifyPassword(rawPass, hash);
    expect(isValid).toBe(true);

    const isWrong = await verifyPassword("WrongPassword", hash);
    expect(isWrong).toBe(false);
  });

  it("creates and verifies cryptographically signed session tokens", async () => {
    const sessionPayload = {
      id: "test-user-123",
      email: "test.student@unidesk.edu",
      name: "Test Student",
      role: "STUDENT" as const,
    };

    const token = await createSessionToken(sessionPayload);
    expect(token).toBeTruthy();

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.email).toBe("test.student@unidesk.edu");
    expect(decoded?.role).toBe("STUDENT");
  });

  it("resolves target department automatically and calculates SLA due date", async () => {
    const itDeptId = await resolveDepartmentForCategory("IT");
    expect(itDeptId).toBeTruthy();

    const itDept = await prisma.department.findUnique({ where: { id: itDeptId } });
    expect(itDept?.code).toBe("IT");

    const dueDateUrgent = await calculateDueTimestamp("IT", "URGENT");
    const now = new Date();
    // Urgent SLA should be ~12 hours from now
    const diffHours = (dueDateUrgent.getTime() - now.getTime()) / (1000 * 3600);
    expect(diffHours).toBeGreaterThan(11);
    expect(diffHours).toBeLessThan(13);
  });

  it("creates a ticket, claims it, moves to IN_PROGRESS, and resolves it", async () => {
    const student = await prisma.user.findUnique({ where: { email: "student@unidesk.edu" } });
    const itStaff = await prisma.user.findUnique({ where: { email: "it.staff@unidesk.edu" } });
    const itDept = await prisma.department.findUnique({ where: { code: "IT" } });

    expect(student).not.toBeNull();
    expect(itStaff).not.toBeNull();
    expect(itDept).not.toBeNull();

    // 1. Create Ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TICK-TEST-${Date.now()}`,
        title: "Integration Test Ticket: Network Interface Down",
        description: "Testing end to end lifecycle state transitions and audit trail logging.",
        category: "IT",
        priority: "HIGH",
        status: "SUBMITTED",
        reporterId: student!.id,
        departmentId: itDept!.id,
        dueAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    expect(ticket.status).toBe("SUBMITTED");
    expect(ticket.assignedToId).toBeNull();

    // 2. Staff Claims Ticket
    const assignedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        assignedToId: itStaff!.id,
        status: "ASSIGNED",
      },
    });
    expect(assignedTicket.status).toBe("ASSIGNED");
    expect(assignedTicket.assignedToId).toBe(itStaff!.id);

    // 3. Move to IN_PROGRESS
    const inProgressTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "IN_PROGRESS" },
    });
    expect(inProgressTicket.status).toBe("IN_PROGRESS");

    // 4. Resolve Ticket
    const resolvedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });
    expect(resolvedTicket.status).toBe("RESOLVED");
    expect(resolvedTicket.resolvedAt).not.toBeNull();

    // Clean up test ticket
    await prisma.ticket.delete({ where: { id: ticket.id } });
  });
});
