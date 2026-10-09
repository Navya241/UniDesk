import { prisma } from "@/lib/prisma";
import { NotificationType } from "@/types";
import { sendEmail } from "@/lib/email";

export interface CreateNotificationParams {
  userId: string;
  ticketId?: string;
  title: string;
  message: string;
  type: NotificationType;
  sendEmailAlert?: boolean;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        ticketId: params.ticketId,
        title: params.title,
        message: params.message,
        type: params.type,
      },
      include: {
        user: true,
      },
    });

    // Send email alert if enabled or for critical events
    if (params.sendEmailAlert !== false && notification.user?.email) {
      await sendEmail({
        to: notification.user.email,
        subject: `[UniDesk] ${params.title}`,
        html: `<p>Hello <strong>${notification.user.name}</strong>,</p><p>${params.message}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tickets/${params.ticketId || ''}">View details in UniDesk Portal</a></p>`,
        text: `Hello ${notification.user.name},\n\n${params.message}\n\nView details: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tickets/${params.ticketId || ''}`,
      });
    }

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

export async function notifyDepartmentStaff(departmentId: string, params: Omit<CreateNotificationParams, "userId">) {
  try {
    const staff = await prisma.user.findMany({
      where: { departmentId, role: "DEPARTMENT_STAFF" },
      select: { id: true, email: true, name: true },
    });

    for (const member of staff) {
      await createNotification({
        ...params,
        userId: member.id,
      });
    }
  } catch (error) {
    console.error("Failed to notify department staff:", error);
  }
}

export async function notifyAdmins(params: Omit<CreateNotificationParams, "userId">) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, name: true },
    });

    for (const admin of admins) {
      await createNotification({
        ...params,
        userId: admin.id,
      });
    }
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
}
