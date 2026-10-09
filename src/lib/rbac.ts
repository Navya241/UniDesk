import { Role, SessionUser } from "@/types";

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

export function canCreateTicket(user: SessionUser): boolean {
  // Students, Faculty, and Admin can create tickets
  return ["STUDENT", "FACULTY", "ADMIN"].includes(user.role);
}

export function canViewTicket(
  user: SessionUser,
  ticket: { reporterId: string; departmentId: string; assignedToId?: string | null }
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "STUDENT" || user.role === "FACULTY") {
    return ticket.reporterId === user.id;
  }
  if (user.role === "DEPARTMENT_STAFF") {
    return user.departmentId === ticket.departmentId;
  }
  return false;
}

export function canManageTicket(
  user: SessionUser,
  ticket: { departmentId: string; assignedToId?: string | null }
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "DEPARTMENT_STAFF") {
    return user.departmentId === ticket.departmentId;
  }
  return false;
}

export function canReopenTicket(
  user: SessionUser,
  ticket: { reporterId: string; status: string }
): boolean {
  const isEligibleStatus = ["RESOLVED", "CLOSED"].includes(ticket.status);
  if (!isEligibleStatus) return false;
  if (user.role === "ADMIN") return true;
  if ((user.role === "STUDENT" || user.role === "FACULTY") && ticket.reporterId === user.id) {
    return true;
  }
  return false;
}

export function canCommentOnTicket(
  user: SessionUser,
  ticket: { reporterId: string; departmentId: string; status: string }
): boolean {
  if (ticket.status === "CLOSED" && user.role !== "ADMIN") return false;
  return canViewTicket(user, ticket);
}

export function canManageFAQs(user: SessionUser): boolean {
  return user.role === "ADMIN";
}

export function canViewAnalytics(user: SessionUser): boolean {
  return user.role === "ADMIN";
}

export function canManageEscalation(user: SessionUser): boolean {
  return user.role === "ADMIN";
}

export function canManageUsers(user: SessionUser): boolean {
  return user.role === "ADMIN";
}

export function canManageDepartments(user: SessionUser): boolean {
  return user.role === "ADMIN";
}
