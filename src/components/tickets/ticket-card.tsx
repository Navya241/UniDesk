import * as React from "react";
import Link from "next/link";
import { TicketSummary, SessionUser } from "@/types";
import { StatusBadge, PriorityBadge, EscalationBadge } from "./status-badge";
import { CATEGORY_LABELS, formatDate, formatTimeAgo } from "@/lib/utils";
import {
  MessageSquare,
  Paperclip,
  Clock,
  Building,
  User,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface TicketCardProps {
  ticket: TicketSummary;
  currentUser: SessionUser;
  onClaim?: (ticketId: string) => void;
}

export function TicketCard({ ticket, currentUser, onClaim }: TicketCardProps) {
  const isAssignedToMe = ticket.assignedTo?.id === currentUser.id;
  const isUnassigned = !ticket.assignedTo;
  const canClaim =
    currentUser.role === "DEPARTMENT_STAFF" &&
    isUnassigned &&
    currentUser.departmentId === ticket.department.id;

  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4">
      <div className="space-y-3">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
              {ticket.ticketNumber}
            </span>
            <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
              {CATEGORY_LABELS[ticket.category] || ticket.category}
            </span>
            <PriorityBadge priority={ticket.priority} />
            <EscalationBadge state={ticket.escalationState} />
          </div>

          <StatusBadge status={ticket.status} />
        </div>

        {/* Title and Description */}
        <div>
          <Link
            href={`/tickets/${ticket.id}`}
            className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1"
          >
            {ticket.title}
          </Link>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {ticket.description}
          </p>
        </div>
      </div>

      {/* Meta details footer */}
      <div className="pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          {/* Reporter or Anonymous */}
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>
              {ticket.isAnonymous ? (
                <span className="font-medium text-slate-500 italic">Anonymous Reporter</span>
              ) : (
                <span className="font-medium text-foreground">{ticket.reporter?.name || "Student"}</span>
              )}
            </span>
          </div>

          {/* Department */}
          <div className="flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5" />
            <span>{ticket.department.name}</span>
          </div>

          {/* Location if present */}
          {ticket.location && (
            <div className="flex items-center gap-1.5 text-foreground font-medium">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground">
                📍 {ticket.location}
              </span>
            </div>
          )}

          {/* SLA Due */}
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Due: {formatDate(ticket.dueAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {ticket._count?.comments ? (
            <span className="flex items-center gap-1 text-[11px]">
              <MessageSquare className="h-3.5 w-3.5" />
              {ticket._count.comments}
            </span>
          ) : null}

          {ticket._count?.attachments ? (
            <span className="flex items-center gap-1 text-[11px]">
              <Paperclip className="h-3.5 w-3.5" />
              {ticket._count.attachments}
            </span>
          ) : null}

          {canClaim && onClaim && (
            <button
              onClick={() => onClaim(ticket.id)}
              className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              Claim Ticket
            </button>
          )}

          <Link
            href={`/tickets/${ticket.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
