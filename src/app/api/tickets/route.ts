import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDepartmentForCategory } from "@/lib/routing";
import { calculateDueTimestamp } from "@/lib/escalation";
import { notifyDepartmentStaff } from "@/lib/notifications";
import { canCreateTicket } from "@/lib/rbac";
import { TicketCategory, TicketPriority, TicketStatus, EscalationState } from "@/types";
import { z } from "zod";

const CreateTicketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long.").max(200),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  location: z.string().max(100).optional().nullable(),
  category: z.enum(["HOSTEL", "ACADEMICS", "IT", "LIBRARY", "ADMINISTRATION", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  isAnonymous: z.boolean().default(false),
  attachments: z.array(
    z.object({
      fileName: z.string(),
      fileUrl: z.string(),
      fileSize: z.number(),
      fileType: z.string(),
    })
  ).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    const departmentId = searchParams.get("departmentId");
    const search = searchParams.get("search");

    // Build query conditions
    const where: any = {};

    // RBAC filtering
    if (user.role === "STUDENT" || user.role === "FACULTY") {
      where.reporterId = user.id;
    } else if (user.role === "DEPARTMENT_STAFF") {
      if (user.departmentId) {
        where.departmentId = user.departmentId;
      }
    }
    // Admins can see all, but can filter by departmentId

    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (departmentId && user.role === "ADMIN") where.departmentId = departmentId;

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { ticketNumber: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
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

    // Transform and scrub reporter info if anonymous and viewer is not admin/reporter
    const sanitizedTickets = tickets.map((t) => {
      const isViewerReporter = t.reporterId === user.id;
      const isAdmin = user.role === "ADMIN";
      const hideIdentity = t.isAnonymous && !isViewerReporter && !isAdmin;

      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        title: t.title,
        description: t.description,
        location: t.location,
        category: t.category,
        priority: t.priority,
        status: t.status,
        isAnonymous: t.isAnonymous,
        reporter: hideIdentity
          ? undefined
          : {
              id: t.reporter.id,
              name: t.reporter.name,
              email: isAdmin ? t.reporter.email : undefined,
              role: t.reporter.role,
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
        dueAt: t.dueAt,
        escalationState: t.escalationState,
        resolvedAt: t.resolvedAt,
        closedAt: t.closedAt,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        _count: t._count,
      };
    });

    return NextResponse.json({ tickets: sanitizedTickets });
  } catch (error) {
    console.error("GET /api/tickets error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canCreateTicket(user)) {
      return NextResponse.json(
        { error: "Your user role is not permitted to create tickets." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = CreateTicketSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { title, description, location, category, priority, isAnonymous, attachments } = result.data;

    // 1. Resolve target department automatically based on category
    const departmentId = await resolveDepartmentForCategory(category as TicketCategory);

    // 2. Calculate SLA Due timestamp
    const dueAt = await calculateDueTimestamp(
      category as TicketCategory,
      priority as TicketPriority
    );

    // 3. Generate sequential ticket number
    const count = await prisma.ticket.count();
    const nextSeq = String(count + 1).padStart(4, "0");
    const year = new Date().getFullYear();
    const ticketNumber = `TICK-${year}-${nextSeq}`;

    // 4. Create Ticket with Attachments & History in a single transaction
    const newTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          title,
          description,
          location: location?.trim() || null,
          category,
          priority,
          status: "SUBMITTED",
          isAnonymous,
          reporterId: user.id,
          departmentId,
          dueAt,
          escalationState: "NONE",
        },
        include: {
          department: true,
          reporter: true,
        },
      });

      // Save attachments if any
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          await tx.ticketAttachment.create({
            data: {
              ticketId: ticket.id,
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileSize: att.fileSize,
              fileType: att.fileType,
              uploadedById: user.id,
            },
          });
        }
      }

      // Record Creation in History
      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          actorId: user.id,
          action: "CREATED",
          notes: `Ticket created with ${priority} priority.${isAnonymous ? " Submitted as Anonymous Grievance." : ""}`,
        },
      });

      return ticket;
    });

    // 5. Trigger Department Notification
    await notifyDepartmentStaff(departmentId, {
      ticketId: newTicket.id,
      title: `New Ticket: #${newTicket.ticketNumber}`,
      message: `A new ${priority} priority ticket "${newTicket.title}" was submitted to ${newTicket.department.name}.`,
      type: "TICKET_CREATED",
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: newTicket.id,
        ticketNumber: newTicket.ticketNumber,
        title: newTicket.title,
        departmentName: newTicket.department.name,
      },
    });
  } catch (error: any) {
    console.error("POST /api/tickets error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create ticket" },
      { status: 500 }
    );
  }
}
