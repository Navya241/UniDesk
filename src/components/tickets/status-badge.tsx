import * as React from "react";
import { TicketStatus, TicketPriority, EscalationState } from "@/types";
import { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_LABELS } from "@/lib/utils";
import { AlertTriangle, Flame } from "lucide-react";

export function StatusBadge({ status }: { status: TicketStatus | string }) {
  const config =
    STATUS_CONFIG[status as TicketStatus] || STATUS_CONFIG.SUBMITTED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority | string }) {
  const config =
    PRIORITY_CONFIG[priority as TicketPriority] || PRIORITY_CONFIG.LOW;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      {priority === "URGENT" && <Flame className="h-3 w-3 text-rose-600 animate-pulse" />}
      {config.label}
    </span>
  );
}

export function EscalationBadge({ state }: { state: EscalationState | string }) {
  if (state !== "ESCALATED") return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
      <AlertTriangle className="h-3 w-3" />
      ESCALATED (SLA BREACH)
    </span>
  );
}
