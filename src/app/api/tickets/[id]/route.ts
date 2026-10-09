import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewTicket, canManageTicket, canReopenTicket, canCommentOnTicket } from "@/lib/rbac";
import { createNotification, notifyDepartmentStaff, notifyAdmins } from "@/lib/notifications";
import { TicketStatus, TicketPriority } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        department: true,
        assignedTo: true,
        reporter: true,
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: true,
            attachments: true,
          },
        },
        attachments: {
          include: {
            uploadedBy: true,
          },
        },
        history: {
          orderBy: { createdAt: "desc" },
          include: {
            actor: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // RBAC Authorization Check
    if (!canViewTicket(user, ticket)) {
      return NextResponse.json(
        { error: "You are not authorized to view this ticket." },
        { status: 403 }
      );
    }

    const isReporter = ticket.reporterId === user.id;
    const isAdmin = user.role === "ADMIN";
    const hideIdentity = ticket.isAnonymous && !isReporter && !isAdmin;

    // Filter out internal comments if user is student/faculty
    const visibleComments = ticket.comments.filter((c) => {
      if (c.isInternal) {
        return ["ADMIN", "DEPARTMENT_STAFF"].includes(user.role);
      }
      return true;
    });

    const sanitizedDetail = {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      isAnonymous: ticket.isAnonymous,
      reporter: hideIdentity
        ? undefined
        : {
            id: ticket.reporter.id,
            name: ticket.reporter.name,
            email: isAdmin ? ticket.reporter.email : undefined,
            role: ticket.reporter.role,
            avatarUrl: ticket.reporter.avatarUrl,
          },
      department: {
        id: ticket.department.id,
        name: ticket.department.name,
        code: ticket.department.code,
      },
      assignedTo: ticket.assignedTo
        ? {
            id: ticket.assignedTo.id,
            name: ticket.assignedTo.name,
            email: ticket.assignedTo.email,
            avatarUrl: ticket.assignedTo.avatarUrl,
          }
        : null,
      dueAt: ticket.dueAt,
      escalationState: ticket.escalationState,
      resolvedAt: ticket.resolvedAt,
      closedAt: ticket.closedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      comments: visibleComments.map((c) => ({
        id: c.id,
        message: c.message,
        isInternal: c.isInternal,
        createdAt: c.createdAt,
        author: {
          id: c.author.id,
          name: ticket.isAnonymous && c.authorId === ticket.reporterId && hideIdentity
            ? "Anonymous Reporter"
            : c.author.name,
          role: c.author.role,
          avatarUrl: c.author.avatarUrl,
        },
        attachments: c.attachments,
      })),
      attachments: ticket.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileSize: a.fileSize,
        fileType: a.fileType,
        uploadedBy: {
          id: a.uploadedBy.id,
          name: ticket.isAnonymous && a.uploadedById === ticket.reporterId && hideIdentity
            ? "Anonymous Reporter"
            : a.uploadedBy.name,
        },
        createdAt: a.createdAt,
      })),
      history: ticket.history.map((h) => ({
        id: h.id,
        action: h.action,
        fieldChanged: h.fieldChanged,
        oldValue: h.oldValue,
        newValue: h.newValue,
        notes: h.notes,
        createdAt: h.createdAt,
        actor: h.actor
          ? {
              id: h.actor.id,
              name: ticket.isAnonymous && h.actorId === ticket.reporterId && hideIdentity
                ? "Anonymous Reporter"
                : h.actor.name,
              role: h.actor.role,
            }
          : null,
      })),
    };

    return NextResponse.json({ ticket: sanitizedDetail });
  } catch (error) {
    console.error("GET /api/tickets/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { department: true, assignedTo: true, reporter: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // 1. REASSIGN (Admin Only)
    if (action === "REASSIGN") {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "Only admins can reassign tickets between departments." }, { status: 403 });
      }

      const { newDepartmentId, newAssignedToId, notes } = body;
      const targetDept = await prisma.department.findUnique({ where: { id: newDepartmentId } });
      if (!targetDept) {
        return NextResponse.json({ error: "Target department does not exist" }, { status: 400 });
      }

      const oldDeptName = ticket.department.name;

      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            departmentId: targetDept.id,
            assignedToId: newAssignedToId || null,
            status: newAssignedToId ? "ASSIGNED" : "SUBMITTED",
          },
        });

        await tx.ticketHistory.create({
          data: {
            ticketId: ticket.id,
            actorId: user.id,
            action: "REASSIGNED",
            fieldChanged: "departmentId",
            oldValue: oldDeptName,
            newValue: targetDept.name,
            notes: notes || `Reassigned by Administrator from ${oldDeptName} to ${targetDept.name}`,
          },
        });

        return t;
      });

      // Notify new department
      await notifyDepartmentStaff(targetDept.id, {
        ticketId: ticket.id,
        title: `Reassigned Ticket: #${ticket.ticketNumber}`,
        message: `Ticket "${ticket.title}" has been reassigned to ${targetDept.name} by Admin.`,
        type: "TICKET_REASSIGNED",
      });

      return NextResponse.json({ success: true, ticket: updated });
    }

    // 2. ASSIGN / CLAIM
    if (action === "ASSIGN") {
      if (!canManageTicket(user, ticket)) {
        return NextResponse.json({ error: "You cannot assign or claim this ticket." }, { status: 403 });
      }

      const assignedToId = body.assignedToId || user.id;
      const staffUser = await prisma.user.findUnique({ where: { id: assignedToId } });
      if (!staffUser) {
        return NextResponse.json({ error: "Staff user not found" }, { status: 400 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            assignedToId: staffUser.id,
            status: ticket.status === "SUBMITTED" ? "ASSIGNED" : ticket.status,
          },
        });

        await tx.ticketHistory.create({
          data: {
            ticketId: ticket.id,
            actorId: user.id,
            action: "ASSIGNED",
            fieldChanged: "assignedToId",
            oldValue: ticket.assignedTo?.name || "Unassigned",
            newValue: staffUser.name,
            notes: `Assigned to ${staffUser.name}`,
          },
        });

        return t;
      });

      // Notify Assignee and Reporter
      await createNotification({
        userId: staffUser.id,
        ticketId: ticket.id,
        title: `Ticket Assigned to You: #${ticket.ticketNumber}`,
        message: `You were assigned Ticket #${ticket.ticketNumber}: "${ticket.title}".`,
        type: "TICKET_ASSIGNED",
      });

      await createNotification({
        userId: ticket.reporterId,
        ticketId: ticket.id,
        title: `Staff Assigned to #${ticket.ticketNumber}`,
        message: `${staffUser.name} from ${ticket.department.name} is handling your ticket.`,
        type: "TICKET_ASSIGNED",
      });

      return NextResponse.json({ success: true, ticket: updated });
    }

    // 3. STATUS CHANGE (SUBMITTED -> IN_PROGRESS -> RESOLVED -> CLOSED)
    if (action === "STATUS_CHANGE") {
      if (!canManageTicket(user, ticket)) {
        return NextResponse.json({ error: "You do not have permission to modify this ticket status." }, { status: 403 });
      }

      const { newStatus, notes } = body;
      const validStatuses = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
      if (!validStatuses.includes(newStatus)) {
        return NextResponse.json({ error: "Invalid ticket status value." }, { status: 400 });
      }

      const now = new Date();
      const updateData: any = { status: newStatus };
      if (newStatus === "RESOLVED") updateData.resolvedAt = now;
      if (newStatus === "CLOSED") updateData.closedAt = now;

      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.ticket.update({
          where: { id: ticket.id },
          data: updateData,
        });

        await tx.ticketHistory.create({
          data: {
            ticketId: ticket.id,
            actorId: user.id,
            action: "STATUS_CHANGED",
            fieldChanged: "status",
            oldValue: ticket.status,
            newValue: newStatus,
            notes: notes || `Status updated from ${ticket.status} to ${newStatus}`,
          },
        });

        return t;
      });

      // Notify Reporter
      const notifyType =
        newStatus === "RESOLVED"
          ? "TICKET_RESOLVED"
          : newStatus === "CLOSED"
          ? "TICKET_CLOSED"
          : "STATUS_CHANGED";

      await createNotification({
        userId: ticket.reporterId,
        ticketId: ticket.id,
        title: `Status Updated: #${ticket.ticketNumber} is now ${newStatus}`,
        message: `Your ticket "${ticket.title}" was updated to ${newStatus}. ${notes || ""}`,
        type: notifyType,
      });

      return NextResponse.json({ success: true, ticket: updated });
    }

    // 4. REOPEN TICKET
    if (action === "REOPEN") {
      if (!canReopenTicket(user, ticket)) {
        return NextResponse.json(
          { error: "You are not authorized to reopen this ticket or it is not eligible." },
          { status: 403 }
        );
      }

      const { reason } = body;

      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            status: "IN_PROGRESS",
            resolvedAt: null,
            closedAt: null,
          },
        });

        await tx.ticketHistory.create({
          data: {
            ticketId: ticket.id,
            actorId: user.id,
            action: "REOPENED",
            fieldChanged: "status",
            oldValue: ticket.status,
            newValue: "IN_PROGRESS",
            notes: reason ? `Ticket Reopened: ${reason}` : "Ticket Reopened by Reporter",
          },
        });

        return t;
      });

      // Notify department staff and assigned staff
      if (ticket.assignedToId) {
        await createNotification({
          userId: ticket.assignedToId,
          ticketId: ticket.id,
          title: `Ticket Reopened: #${ticket.ticketNumber}`,
          message: `Ticket "${ticket.title}" was reopened by the user: ${reason || ""}`,
          type: "TICKET_REOPENED",
        });
      } else {
        await notifyDepartmentStaff(ticket.departmentId, {
          ticketId: ticket.id,
          title: `Ticket Reopened: #${ticket.ticketNumber}`,
          message: `Ticket "${ticket.title}" was reopened by the user.`,
          type: "TICKET_REOPENED",
        });
      }

      return NextResponse.json({ success: true, ticket: updated });
    }

    return NextResponse.json({ error: "Unknown action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("PATCH /api/tickets/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update ticket" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { message, isInternal, attachments } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: "Comment message cannot be empty" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { department: true, assignedTo: true, reporter: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (!canCommentOnTicket(user, ticket)) {
      return NextResponse.json(
        { error: "You do not have permission to comment on this ticket." },
        { status: 403 }
      );
    }

    // Only staff & admins can create internal notes
    const internalNote = Boolean(isInternal) && ["ADMIN", "DEPARTMENT_STAFF"].includes(user.role);

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.ticketComment.create({
        data: {
          ticketId: ticket.id,
          authorId: user.id,
          message: message.trim(),
          isInternal: internalNote,
        },
        include: {
          author: true,
        },
      });

      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          await tx.ticketAttachment.create({
            data: {
              ticketId: ticket.id,
              commentId: c.id,
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileSize: att.fileSize,
              fileType: att.fileType,
              uploadedById: user.id,
            },
          });
        }
      }

      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          actorId: user.id,
          action: "COMMENT_ADDED",
          notes: internalNote ? "Added internal staff note" : "Added public comment",
        },
      });

      return c;
    });

    // Send notifications to appropriate parties
    if (!internalNote) {
      // If student/faculty commented, notify assigned staff or department
      if (user.id === ticket.reporterId) {
        if (ticket.assignedToId) {
          await createNotification({
            userId: ticket.assignedToId,
            ticketId: ticket.id,
            title: `New Comment on #${ticket.ticketNumber}`,
            message: `${ticket.isAnonymous ? "Anonymous User" : user.name} replied to Ticket #${ticket.ticketNumber}.`,
            type: "NEW_COMMENT",
          });
        } else {
          await notifyDepartmentStaff(ticket.departmentId, {
            ticketId: ticket.id,
            title: `New Comment on #${ticket.ticketNumber}`,
            message: `New comment on unassigned Ticket #${ticket.ticketNumber}.`,
            type: "NEW_COMMENT",
          });
        }
      } else {
        // If staff commented, notify reporter
        await createNotification({
          userId: ticket.reporterId,
          ticketId: ticket.id,
          title: `Update on Ticket #${ticket.ticketNumber}`,
          message: `${user.name} from ${ticket.department.name} added a comment.`,
          type: "NEW_COMMENT",
        });
      }
    }

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    console.error("POST /api/tickets/[id] comment error:", error);
    return NextResponse.json({ error: error.message || "Failed to post comment" }, { status: 500 });
  }
}
