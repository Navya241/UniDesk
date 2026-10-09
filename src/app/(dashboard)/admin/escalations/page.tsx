"use client";

import * as React from "react";
import { TicketCategory } from "@/types";
import { CATEGORY_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Edit,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface EscalationConfigItem {
  id: string;
  category: TicketCategory;
  lowHours: number;
  mediumHours: number;
  highHours: number;
  urgentHours: number;
  notifyAdmin: boolean;
}

export default function AdminEscalationsPage() {
  const [configs, setConfigs] = React.useState<EscalationConfigItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCheckingSLA, setIsCheckingSLA] = React.useState(false);
  const [checkResult, setCheckResult] = React.useState<string | null>(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingConfig, setEditingConfig] = React.useState<EscalationConfigItem | null>(null);
  const [lowHours, setLowHours] = React.useState("72");
  const [mediumHours, setMediumHours] = React.useState("48");
  const [highHours, setHighHours] = React.useState("24");
  const [urgentHours, setUrgentHours] = React.useState("12");
  const [notifyAdmin, setNotifyAdmin] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const fetchConfigs = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/escalations");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch (err) {
      console.error("Failed to load escalation configs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleRunSLA = async () => {
    try {
      setIsCheckingSLA(true);
      setCheckResult(null);
      const res = await fetch("/api/escalation/check", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCheckResult(
          `SLA Escalation run successful. Checked at ${new Date(data.checkedAt).toLocaleTimeString()}. Escalated ${data.escalatedCount} overdue ticket(s).`
        );
      }
    } catch {
      setCheckResult("Failed to execute SLA Escalation run.");
    } finally {
      setIsCheckingSLA(false);
    }
  };

  const handleOpenEdit = (cfg: EscalationConfigItem) => {
    setEditingConfig(cfg);
    setLowHours(String(cfg.lowHours));
    setMediumHours(String(cfg.mediumHours));
    setHighHours(String(cfg.highHours));
    setUrgentHours(String(cfg.urgentHours));
    setNotifyAdmin(cfg.notifyAdmin);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingConfig) return;
    setIsSaving(true);
    try {
      await fetch("/api/admin/escalations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: editingConfig.category,
          lowHours,
          mediumHours,
          highHours,
          urgentHours,
          notifyAdmin,
        }),
      });
      setIsModalOpen(false);
      fetchConfigs();
    } catch (err) {
      console.error("Failed to save SLA config:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary" />
            <span>SLA & Escalation Engine Settings</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure target resolution times per category and trigger automated SLA breach sweeps
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={handleRunSLA}
            isLoading={isCheckingSLA}
            className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 font-bold shadow-md shadow-rose-600/20"
          >
            <Play className="h-4 w-4 mr-1.5 fill-current" />
            <span>Run SLA Engine Sweep</span>
          </Button>
        </div>
      </div>

      {checkResult && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{checkResult}</span>
          </div>
          <button onClick={() => setCheckResult(null)} className="font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* SLA Info Banner */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-2">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          How Automated Escalation Works in UniDesk
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          When a student or faculty member submits a ticket, the system calculates <code>dueAt = createdAt + SLA_Hours(Priority, Category)</code>.
          If the ticket remains unresolved past this target time, running the SLA check will mark the ticket as <strong>ESCALATED</strong>,
          post an immutable history audit entry, and dispatch urgent alerts to department staff and super administrators.
        </p>
      </div>

      {/* SLA Configs Table */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          Loading SLA configurations...
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-4">Category</th>
                  <th className="p-4">Low Priority SLA</th>
                  <th className="p-4">Medium Priority SLA</th>
                  <th className="p-4">High Priority SLA</th>
                  <th className="p-4">Urgent Priority SLA</th>
                  <th className="p-4">Admin Alerts</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {configs.map((cfg) => (
                  <tr key={cfg.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-bold text-foreground">
                      {CATEGORY_LABELS[cfg.category] || cfg.category}
                    </td>
                    <td className="p-4">{cfg.lowHours} Hours</td>
                    <td className="p-4">{cfg.mediumHours} Hours</td>
                    <td className="p-4 font-semibold text-amber-600 dark:text-amber-400">
                      {cfg.highHours} Hours
                    </td>
                    <td className="p-4 font-bold text-rose-600 dark:text-rose-400">
                      {cfg.urgentHours} Hours
                    </td>
                    <td className="p-4">
                      {cfg.notifyAdmin ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Enabled
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Disabled</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(cfg)}
                        className="h-8 text-xs font-semibold"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit SLA
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit SLA Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingConfig ? `SLA for ${CATEGORY_LABELS[editingConfig.category]}` : "Edit SLA"}
        description="Set resolution hour thresholds for this category."
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Low Priority SLA (Hours)"
            type="number"
            value={lowHours}
            onChange={(e) => setLowHours(e.target.value)}
            required
          />
          <Input
            label="Medium Priority SLA (Hours)"
            type="number"
            value={mediumHours}
            onChange={(e) => setMediumHours(e.target.value)}
            required
          />
          <Input
            label="High Priority SLA (Hours)"
            type="number"
            value={highHours}
            onChange={(e) => setHighHours(e.target.value)}
            required
          />
          <Input
            label="Urgent Priority SLA (Hours)"
            type="number"
            value={urgentHours}
            onChange={(e) => setUrgentHours(e.target.value)}
            required
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="notify-admin"
              checked={notifyAdmin}
              onChange={(e) => setNotifyAdmin(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="notify-admin" className="text-xs font-semibold text-foreground">
              Send high-priority notification to Super Admins upon SLA breach
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave}>
              Save SLA Thresholds
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
