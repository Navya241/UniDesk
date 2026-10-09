"use client";

import * as React from "react";
import { TicketCategory } from "@/types";
import { CATEGORY_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Building2, Plus, Edit, RefreshCw, Layers } from "lucide-react";

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  defaultCategory?: TicketCategory | null;
  _count: {
    staffMembers: number;
    tickets: number;
  };
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = React.useState<DepartmentItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingDept, setEditingDept] = React.useState<DepartmentItem | null>(null);
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [defaultCategory, setDefaultCategory] = React.useState<string>("IT");
  const [isSaving, setIsSaving] = React.useState(false);

  const fetchDepartments = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleOpenAdd = () => {
    setEditingDept(null);
    setName("");
    setCode("");
    setDescription("");
    setDefaultCategory("IT");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description || "");
    setDefaultCategory(dept.defaultCategory || "IT");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (editingDept) {
        await fetch("/api/departments", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingDept.id,
            name: name.trim(),
            description: description.trim(),
            defaultCategory,
          }),
        });
      } else {
        await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            code: code.trim(),
            description: description.trim(),
            defaultCategory,
          }),
        });
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      console.error("Failed to save department:", err);
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
            <Building2 className="h-7 w-7 text-primary" />
            <span>Campus Departments & Routing</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure automatic category-to-department routing rules and manage staff allocations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => fetchDepartments()}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" variant="primary" onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Department
          </Button>
        </div>
      </div>

      {/* Department Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          Loading departments...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-primary/10 text-primary">
                    CODE: {dept.code}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {dept._count.staffMembers} Staff &bull; {dept._count.tickets} Tickets
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground">{dept.name}</h3>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {dept.description || "No description provided."}
                </p>

                {dept.defaultCategory && (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Auto-routed Category:
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      <Layers className="h-3 w-3" />
                      {CATEGORY_LABELS[dept.defaultCategory] || dept.defaultCategory}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border/70 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(dept)}>
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit Configuration
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? `Edit ${editingDept.name}` : "Create New Department"}
        description="Configure department routing mappings and description."
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Department Name *"
            placeholder="e.g. Student Welfare & Counseling"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {!editingDept && (
            <Input
              label="Department Code *"
              placeholder="e.g. SWC"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          )}

          <Textarea
            label="Department Description"
            placeholder="Primary scope of operations, coverage hours..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Select
            label="Default Ticket Category Mapped *"
            value={defaultCategory}
            onChange={(e) => setDefaultCategory(e.target.value)}
            options={[
              { value: "IT", label: "IT Support" },
              { value: "HOSTEL", label: "Hostel Department" },
              { value: "ACADEMICS", label: "Academic Affairs" },
              { value: "LIBRARY", label: "Library Services" },
              { value: "ADMINISTRATION", label: "Administration" },
              { value: "OTHER", label: "General Support" },
            ]}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave}>
              Save Department
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
