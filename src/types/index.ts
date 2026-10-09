export type Role = "STUDENT" | "FACULTY" | "DEPARTMENT_STAFF" | "ADMIN";

export type TicketCategory =
  | "HOSTEL"
  | "ACADEMICS"
  | "IT"
  | "LIBRARY"
  | "ADMINISTRATION"
  | "OTHER";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketStatus =
  | "SUBMITTED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export type EscalationState = "NONE" | "WARNING" | "ESCALATED";

export type NotificationType =
  | "TICKET_CREATED"
  | "TICKET_ASSIGNED"
  | "TICKET_REASSIGNED"
  | "STATUS_CHANGED"
  | "NEW_COMMENT"
  | "TICKET_RESOLVED"
  | "TICKET_CLOSED"
  | "TICKET_REOPENED"
  | "ESCALATED";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  departmentId?: string | null;
  departmentName?: string | null;
  avatarUrl?: string | null;
}

export interface TicketSummary {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  isAnonymous: boolean;
  reporter?: {
    id: string;
    name: string;
    email?: string;
    role: Role;
    avatarUrl?: string | null;
  };
  department: {
    id: string;
    name: string;
    code: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
  } | null;
  dueAt: string | Date;
  escalationState: EscalationState;
  resolvedAt?: string | Date | null;
  closedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface TicketDetail extends TicketSummary {
  comments: Array<{
    id: string;
    message: string;
    isInternal: boolean;
    createdAt: string | Date;
    author: {
      id: string;
      name: string;
      role: Role;
      avatarUrl?: string | null;
    };
    attachments?: Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
    }>;
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    uploadedBy: {
      id: string;
      name: string;
    };
    createdAt: string | Date;
  }>;
  history: Array<{
    id: string;
    action: string;
    fieldChanged?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    notes?: string | null;
    createdAt: string | Date;
    actor?: {
      id: string;
      name: string;
      role: Role;
    } | null;
  }>;
}

export interface AnalyticsData {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  escalatedTickets: number;
  resolutionRate: number; // percentage (0 - 100)
  avgResolutionHours: number; // in hours
  ticketsByCategory: Array<{ category: string; count: number; label: string }>;
  ticketsByPriority: Array<{ priority: string; count: number; color: string }>;
  ticketsByDepartment: Array<{ department: string; count: number; code: string }>;
  ticketsByStatus: Array<{ status: string; count: number }>;
  ticketTrends: Array<{ date: string; created: number; resolved: number }>;
  recurringKeywords: Array<{ word: string; count: number; category: string }>;
}
