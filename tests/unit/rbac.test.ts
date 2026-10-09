import { describe, it, expect } from "vitest";
import {
  canCreateTicket,
  canViewTicket,
  canManageTicket,
  canReopenTicket,
  canCommentOnTicket,
  canManageFAQs,
  canViewAnalytics,
} from "@/lib/rbac";
import { SessionUser } from "@/types";

describe("Role-Based Access Control (RBAC)", () => {
  const studentUser: SessionUser = {
    id: "user-student-1",
    email: "student@unidesk.edu",
    name: "Student User",
    role: "STUDENT",
  };

  const facultyUser: SessionUser = {
    id: "user-faculty-1",
    email: "faculty@unidesk.edu",
    name: "Faculty User",
    role: "FACULTY",
  };

  const itStaffUser: SessionUser = {
    id: "user-it-staff",
    email: "it.staff@unidesk.edu",
    name: "IT Staff",
    role: "DEPARTMENT_STAFF",
    departmentId: "dept-it-id",
  };

  const hostelStaffUser: SessionUser = {
    id: "user-hostel-staff",
    email: "hostel.staff@unidesk.edu",
    name: "Hostel Staff",
    role: "DEPARTMENT_STAFF",
    departmentId: "dept-hostel-id",
  };

  const adminUser: SessionUser = {
    id: "user-admin-1",
    email: "admin@unidesk.edu",
    name: "Admin User",
    role: "ADMIN",
  };

  it("permits Students, Faculty, and Admin to create tickets", () => {
    expect(canCreateTicket(studentUser)).toBe(true);
    expect(canCreateTicket(facultyUser)).toBe(true);
    expect(canCreateTicket(adminUser)).toBe(true);
    expect(canCreateTicket(itStaffUser)).toBe(false);
  });

  it("restricts viewing tickets to owners, respective department staff, and admins", () => {
    const itTicket = {
      reporterId: studentUser.id,
      departmentId: "dept-it-id",
    };

    // Owner can view
    expect(canViewTicket(studentUser, itTicket)).toBe(true);
    // Unrelated student cannot view
    expect(canViewTicket({ ...studentUser, id: "other-student" }, itTicket)).toBe(false);
    // IT staff can view their department ticket
    expect(canViewTicket(itStaffUser, itTicket)).toBe(true);
    // Hostel staff CANNOT view IT department ticket
    expect(canViewTicket(hostelStaffUser, itTicket)).toBe(false);
    // Admin can view all
    expect(canViewTicket(adminUser, itTicket)).toBe(true);
  });

  it("enforces reopen restrictions only on eligible status (RESOLVED/CLOSED) by owner or admin", () => {
    const resolvedTicket = {
      reporterId: studentUser.id,
      status: "RESOLVED",
    };

    const inProgressTicket = {
      reporterId: studentUser.id,
      status: "IN_PROGRESS",
    };

    // Owner can reopen resolved ticket
    expect(canReopenTicket(studentUser, resolvedTicket)).toBe(true);
    // Admin can reopen resolved ticket
    expect(canReopenTicket(adminUser, resolvedTicket)).toBe(true);
    // Staff cannot reopen
    expect(canReopenTicket(itStaffUser, resolvedTicket)).toBe(false);
    // Cannot reopen a ticket that is already in progress
    expect(canReopenTicket(studentUser, inProgressTicket)).toBe(false);
  });

  it("enforces admin-only capabilities for system analytics and FAQs", () => {
    expect(canManageFAQs(adminUser)).toBe(true);
    expect(canManageFAQs(studentUser)).toBe(false);
    expect(canManageFAQs(itStaffUser)).toBe(false);

    expect(canViewAnalytics(adminUser)).toBe(true);
    expect(canViewAnalytics(studentUser)).toBe(false);
    expect(canViewAnalytics(itStaffUser)).toBe(false);
  });
});
