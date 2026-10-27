"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TicketDetail, SessionUser, TicketStatus, TicketCategory } from "@/types";
import { StatusBadge, PriorityBadge, EscalationBadge } from "@/components/tickets/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  CATEGORY_LABELS,
  ROLE_LABELS,
  formatDate,
  formatTimeAgo,
} from "@/lib/utils";
import {
  Clock,
  Building,
  User,
  ShieldCheck,
  Paperclip,
  Send,
  Lock,
  MessageSquare,
  History,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  FileText,
  Sparkles,
} from "lucide-react";

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [currentUser, setCurrentUser] = React.useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Comment State
  const [commentMessage, setCommentMessage] = React.useState("");
  const [isInternalComment, setIsInternalComment] = React.useState(false);
  const [commentAttachments, setCommentAttachments] = React.useState<
    Array<{ fileName: string; fileUrl: string; fileSize: number; fileType: string }>
  >([]);
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);

  // Status Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
  const [newStatus, setNewStatus] = React.useState<TicketStatus>("IN_PROGRESS");
  const [statusNotes, setStatusNotes] = React.useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  // Reopen Modal State
  const [isReopenModalOpen, setIsReopenModalOpen] = React.useState(false);
  const [reopenReason, setReopenReason] = React.useState("");
  const [isReopening, setIsReopening] = React.useState(false);

  // Admin Reassign Modal State
  const [isReassignModalOpen, setIsReassignModalOpen] = React.useState(false);
  const [departments, setDepartments] = React.useState<Array<{ id: string; name: string }>>([]);
  const [reassignDeptId, setReassignDeptId] = React.useState("");
  const [reassignNotes, setReassignNotes] = React.useState("");
  const [isReassigning, setIsReassigning] = React.useState(false);

  const fetchTicket = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [ticketRes, meRes] = await Promise.all([
        fetch(`/api/tickets/${id}`),
        fetch("/api/auth/me"),
      ]);

      if (!ticketRes.ok) {
        const data = await ticketRes.json();
        setError(data.error || "Failed to load ticket details");
        return;
      }

      const data = await ticketRes.json();
      setTicket(data.ticket);

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // Load departments if admin
  React.useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetch("/api/departments")
        .then((res) => res.json())
        .then((data) => {
          if (data.departments) {
            setDepartments(data.departments);
            if (data.departments.length > 0) {
              setReassignDeptId(data.departments[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentMessage.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: commentMessage.trim(),
          isInternal: isInternalComment,
          attachments: commentAttachments,
        }),
      });

      if (res.ok) {
        setCommentMessage("");
        setIsInternalComment(false);
        setCommentAttachments([]);
        fetchTicket();
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "STATUS_CHANGE",
          newStatus,
          notes: statusNotes,
        }),
      });

      if (res.ok) {
        setIsStatusModalOpen(false);
        setStatusNotes("");
        fetchTicket();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReopen = async () => {
    setIsReopening(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REOPEN",
          reason: reopenReason,
        }),
      });

      if (res.ok) {
        setIsReopenModalOpen(false);
        setReopenReason("");
        fetchTicket();
      }
    } catch (err) {
      console.error("Failed to reopen ticket:", err);
    } finally {
      setIsReopening(false);
    }
  };

  const handleReassign = async () => {
    setIsReassigning(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REASSIGN",
          newDepartmentId: reassignDeptId,
          notes: reassignNotes,
        }),
      });

      if (res.ok) {
        setIsReassignModalOpen(false);
        setReassignNotes("");
        fetchTicket();
      }
    } catch (err) {
      console.error("Failed to reassign ticket:", err);
    } finally {
      setIsReassigning(false);
    }
  };

  const handleClaim = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ASSIGN" }),
      });
      if (res.ok) {
        fetchTicket();
      }
    } catch (err) {
      console.error("Failed to claim ticket:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="animate-spin inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
        <p className="text-xs text-muted-foreground">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-4 max-w-lg mx-auto">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Access Restricted or Not Found</h2>
        <p className="text-xs text-muted-foreground">{error || "Unable to view this ticket."}</p>
        <Link href="/tickets">
          <Button variant="primary" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Tickets
          </Button>
        </Link>
      </div>
    );
  }

  const canManage =
    currentUser &&
    (currentUser.role === "ADMIN" ||
      (currentUser.role === "DEPARTMENT_STAFF" &&
        currentUser.departmentId === ticket.department.id));

  const canReopen =
    ["RESOLVED", "CLOSED"].includes(ticket.status) &&
    currentUser &&
    (currentUser.role === "ADMIN" ||
      ((currentUser.role === "STUDENT" || currentUser.role === "FACULTY") &&
        ticket.reporter?.id === currentUser.id));

  const isStaffOrAdmin =
    currentUser && ["ADMIN", "DEPARTMENT_STAFF"].includes(currentUser.role);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Back link & Quick actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Ticket Queue</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Claim Ticket if staff and unassigned */}
          {currentUser?.role === "DEPARTMENT_STAFF" &&
            !ticket.assignedTo &&
            currentUser.departmentId === ticket.department.id && (
              <Button size="sm" variant="primary" onClick={handleClaim}>
                Claim This Ticket
              </Button>
            )}

          {/* Change Status Modal Trigger */}
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNewStatus(ticket.status);
                setIsStatusModalOpen(true);
              }}
            >
              Update Status
            </Button>
          )}

          {/* Admin Reassignment */}
          {currentUser?.role === "ADMIN" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsReassignModalOpen(true)}
            >
              Reassign Department
            </Button>
          )}

          {/* Reopen Action for Resolved/Closed */}
          {canReopen && (
            <Button
              size="sm"
              variant="secondary"
              className="border border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
              onClick={() => setIsReopenModalOpen(true)}
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Reopen Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Main Ticket Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
              {ticket.ticketNumber}
            </span>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
              {CATEGORY_LABELS[ticket.category] || ticket.category}
            </span>
            <PriorityBadge priority={ticket.priority} />
            <EscalationBadge state={ticket.escalationState} />
            {ticket.isAnonymous && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Lock className="h-3 w-3" /> Anonymous Grievance
              </span>
            )}
          </div>

          <StatusBadge status={ticket.status} />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
          {ticket.title}
        </h1>

        {/* Description */}
        <div className="p-5 rounded-2xl bg-muted/30 border border-border/60 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {ticket.description}
        </div>

        {/* Attachments Section */}
        {ticket.attachments.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5" /> Attachments ({ticket.attachments.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {ticket.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border hover:border-primary text-xs transition-all group"
                >
                  <FileText className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{att.fileName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(att.fileSize / 1024).toFixed(0)} KB &bull; Uploaded by {att.uploadedBy.name}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Meta Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-6 border-t border-border/70 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Reporter:</span>
            <span className="font-semibold text-foreground mt-0.5 block">
              {ticket.isAnonymous && !ticket.reporter ? (
                <span className="italic text-slate-500">Anonymous Reporter</span>
              ) : (
                ticket.reporter?.name || "Student"
              )}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px]">Department:</span>
            <span className="font-semibold text-foreground mt-0.5 block">
              {ticket.department.name}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px]">Location / Room:</span>
            <span className="font-semibold text-foreground mt-0.5 block">
              {ticket.location || <span className="text-muted-foreground italic">Not specified</span>}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px]">Assigned Staff:</span>
            <span className="font-semibold text-foreground mt-0.5 block">
              {ticket.assignedTo ? ticket.assignedTo.name : (
                <span className="italic text-amber-500">Unassigned in Queue</span>
              )}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px]">SLA Target Deadline:</span>
            <span className="font-semibold text-foreground mt-0.5 block">
              {formatDate(ticket.dueAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Chronological Comment Thread (Left 2 Col) & Audit Trail History (Right 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Comment Thread (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Activity & Comments ({ticket.comments.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              {ticket.status === "CLOSED" ? "Ticket is closed" : "Live resolution thread"}
            </span>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {ticket.comments.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                No comments or messages posted yet.
              </div>
            ) : (
              ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    comment.isInternal
                      ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                      : "bg-card border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {comment.author.name.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {comment.author.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {ROLE_LABELS[comment.author.role] || comment.author.role}
                      </span>
                      {comment.isInternal && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" /> Internal Staff Note
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap pl-9">
                    {comment.message}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Comment Form */}
          {ticket.status !== "CLOSED" || currentUser?.role === "ADMIN" ? (
            <form
              onSubmit={handleAddComment}
              className="rounded-3xl border border-border bg-card p-5 space-y-4 shadow-sm"
            >
              <h4 className="text-xs font-bold text-foreground">Post a Message or Update</h4>

              <Textarea
                placeholder="Type your response, clarification, or update here..."
                rows={3}
                value={commentMessage}
                onChange={(e) => setCommentMessage(e.target.value)}
                required
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {isStaffOrAdmin ? (
                  <label className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Internal note (hidden from student/faculty)</span>
                  </label>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Notifications sent to assigned staff on reply
                  </span>
                )}

                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  isLoading={isSubmittingComment}
                  className="font-semibold shadow-sm"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  <span>Post Comment</span>
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-muted/40 text-center text-xs text-muted-foreground">
              This ticket is closed. If you still have problems, click <strong>Reopen Ticket</strong> above.
            </div>
          )}
        </div>

        {/* Audit Trail History Timeline (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Audit Trail History
            </h3>
            <span className="text-[11px] text-muted-foreground">Immutable Log</span>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {ticket.history.map((record) => (
                <div key={record.id} className="relative text-xs space-y-1">
                  {/* Dot */}
                  <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />

                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-foreground">
                      {record.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(record.createdAt)}
                    </span>
                  </div>

                  {record.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {record.notes}
                    </p>
                  )}

                  {record.actor && (
                    <p className="text-[10px] text-slate-500">
                      By: {record.actor.name} ({ROLE_LABELS[record.actor.role] || record.actor.role})
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Update Status */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Ticket Resolution Status"
        description="Change lifecycle state and provide optional update notes for the user."
      >
        <div className="space-y-4 pt-2">
          <Select
            label="Target Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
            options={[
              { value: "ASSIGNED", label: "ASSIGNED (Assigned to department staff)" },
              { value: "IN_PROGRESS", label: "IN_PROGRESS (Actively diagnosing / working)" },
              { value: "RESOLVED", label: "RESOLVED (Fix applied, awaiting user sign-off)" },
              { value: "CLOSED", label: "CLOSED (Permanently completed)" },
            ]}
          />

          <Textarea
            label="Resolution / Status Notes"
            placeholder="e.g. Replaced faulty hardware on switch port 24. Verified signal levels."
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isUpdatingStatus}
              onClick={handleUpdateStatus}
            >
              Confirm State Change
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Reopen Ticket */}
      <Modal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        title="Reopen Support Ticket"
        description="Provide a reason why the issue persists or requires further resolution."
      >
        <div className="space-y-4 pt-2">
          <Textarea
            label="Reason for Reopening *"
            placeholder="e.g. Wi-Fi connection dropped again this morning during the 10 AM lecture..."
            rows={4}
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsReopenModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isReopening}
              onClick={handleReopen}
            >
              Reopen Ticket
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Admin Reassign Department */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title="Admin Department Reassignment"
        description="Re-route this ticket to another department with administrative audit tracking."
      >
        <div className="space-y-4 pt-2">
          <Select
            label="Select Destination Department"
            value={reassignDeptId}
            onChange={(e) => setReassignDeptId(e.target.value)}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />

          <Textarea
            label="Administrative Reassignment Notes"
            placeholder="Reason for rerouting ticket to another team..."
            value={reassignNotes}
            onChange={(e) => setReassignNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsReassignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isReassigning}
              onClick={handleReassign}
            >
              Reassign Ticket
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
