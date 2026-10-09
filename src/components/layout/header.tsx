"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Plus, ShieldAlert, Sparkles } from "lucide-react";
import { SessionUser } from "@/types";
import { NotificationDropdown } from "./notification-dropdown";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  user: SessionUser;
  onOpenMobileMenu: () => void;
}

export function Header({ user, onOpenMobileMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border/80 bg-background/80 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm sm:text-base text-foreground tracking-tight">
            UniDesk Campus Portal
          </span>
          {user.role === "ADMIN" && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ShieldAlert className="h-3 w-3" />
              Admin Mode
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {["STUDENT", "FACULTY", "ADMIN"].includes(user.role) && (
          <Link href="/tickets/new" className="hidden sm:block">
            <Button size="sm" variant="primary" className="shadow-sm">
              <Plus className="h-4 w-4 mr-1.5" />
              <span>New Ticket</span>
            </Button>
          </Link>
        )}

        <NotificationDropdown />
      </div>
    </header>
  );
}
