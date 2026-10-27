"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  HelpCircle,
  BarChart3,
  Users,
  Building2,
  Clock,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Role, SessionUser } from "@/types";
import { ROLE_LABELS } from "@/lib/utils";

interface SidebarProps {
  user: SessionUser;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ user, isOpenMobile, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const navItems = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["STUDENT", "FACULTY", "DEPARTMENT_STAFF", "ADMIN"] as Role[],
    },
    {
      title: "All Tickets",
      href: "/tickets",
      icon: Ticket,
      roles: ["STUDENT", "FACULTY", "DEPARTMENT_STAFF", "ADMIN"] as Role[],
    },
    {
      title: "Create Ticket",
      href: "/tickets/new",
      icon: PlusCircle,
      roles: ["STUDENT", "FACULTY", "ADMIN"] as Role[],
      highlight: true,
    },
    {
      title: "Campus FAQs",
      href: "/faqs",
      icon: HelpCircle,
      roles: ["STUDENT", "FACULTY", "DEPARTMENT_STAFF", "ADMIN"] as Role[],
    },
    // Admin Only Links
    {
      title: "System Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      roles: ["ADMIN"] as Role[],
    },
    {
      title: "User Management",
      href: "/admin/users",
      icon: Users,
      roles: ["ADMIN"] as Role[],
    },
    {
      title: "Departments",
      href: "/admin/departments",
      icon: Building2,
      roles: ["ADMIN"] as Role[],
    },
    {
      title: "SLA & Escalation",
      href: "/admin/escalations",
      icon: Clock,
      roles: ["ADMIN"] as Role[],
    },
    {
      title: "Audit Trail",
      href: "/admin/audit-logs",
      icon: ShieldCheck,
      roles: ["ADMIN"] as Role[],
    },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));

  const content = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-400/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-primary bg-clip-text text-transparent">
                UniDesk
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">University Helpdesk</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {filteredNav.map((item) => {
            let isActive = false;
            if (item.href === "/dashboard") {
              isActive = pathname === "/dashboard";
            } else if (item.href === "/tickets/new") {
              isActive = pathname === "/tickets/new";
            } else if (item.href === "/tickets") {
              isActive = pathname === "/tickets" || (pathname.startsWith("/tickets/") && pathname !== "/tickets/new");
            } else {
              isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            }
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                  <span>{item.title}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4 opacity-75" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout section */}
      <div className="space-y-3 pt-4 border-t border-border/70">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-muted/40 border border-border/50">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {ROLE_LABELS[user.role]} {user.departmentName ? `• ${user.departmentName}` : ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30 border-r border-border bg-card shadow-sm">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border shadow-2xl z-50">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
