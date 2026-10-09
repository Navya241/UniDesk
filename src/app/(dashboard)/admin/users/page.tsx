"use client";

import * as React from "react";
import { Role } from "@/types";
import { ROLE_LABELS, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Edit,
  Shield,
  Search,
  Building,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  createdAt: string;
  _count: {
    reportedTickets: number;
    assignedTickets: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [departments, setDepartments] = React.useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  // Edit/Add modal
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserItem | null>(null);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("STUDENT");
  const [departmentId, setDepartmentId] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const [uRes, dRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/departments"),
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData.users || []);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setDepartments(dData.departments || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("UniDesk@123");
    setRole("STUDENT");
    setDepartmentId(departments[0]?.id || "");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setDepartmentId(user.departmentId || departments[0]?.id || "");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingUser) {
        await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: editingUser.id,
            role,
            departmentId: role === "DEPARTMENT_STAFF" ? departmentId : null,
          }),
        });
      } else {
        await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
            departmentId: role === "DEPARTMENT_STAFF" ? departmentId : null,
          }),
        });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error("Failed to save user:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            <span>User & Access Control</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage university users, change roles, assign staff to departments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="outline" onClick={() => fetchUsers()}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" variant="primary" onClick={handleOpenAdd}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Add User
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full pl-10 pr-4 rounded-2xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          Loading user records...
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Assigned Department</th>
                  <th className="p-4">Tickets Reported</th>
                  <th className="p-4">Tickets Assigned</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{user.name}</p>
                          <p className="text-[11px] text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                          user.role === "ADMIN"
                            ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                            : user.role === "DEPARTMENT_STAFF"
                            ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            : "bg-slate-500/10 text-slate-600 border border-slate-500/20"
                        }`}
                      >
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>

                    <td className="p-4 text-muted-foreground">
                      {user.department ? user.department.name : "—"}
                    </td>

                    <td className="p-4 font-semibold text-foreground">
                      {user._count.reportedTickets}
                    </td>

                    <td className="p-4 font-semibold text-foreground">
                      {user._count.assignedTickets}
                    </td>

                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(user)}
                        className="h-8 text-xs font-semibold"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit Role
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? `Edit ${editingUser.name}` : "Create New User"}
        description="Configure access role and department membership."
      >
        <div className="space-y-4 pt-2">
          {!editingUser && (
            <>
              <Input
                label="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email Address *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Initial Password *"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </>
          )}

          <Select
            label="System Role *"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            options={[
              { value: "STUDENT", label: "Student (Create & track own tickets)" },
              { value: "FACULTY", label: "Faculty (Submit tickets & departmental inquiries)" },
              { value: "DEPARTMENT_STAFF", label: "Department Staff (Manage department queue)" },
              { value: "ADMIN", label: "Administrator (Full system control & analytics)" },
            ]}
          />

          {role === "DEPARTMENT_STAFF" && (
            <Select
              label="Assigned Department *"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave}>
              Save User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
