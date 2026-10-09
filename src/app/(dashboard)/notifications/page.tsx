"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatTimeAgo } from "@/lib/utils";

interface NotificationItem {
  id: string;
  ticketId?: string | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<"ALL" | "UNREAD">("ALL");

  const fetchNotifications = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_ALL_READ" }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleMarkSingle = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_READ", notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time updates regarding your ticket claims, status modifications, comments, and SLA alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchNotifications()}
            className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Refresh notifications"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4 mr-1.5 text-primary" />
              <span>Mark All as Read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            filter === "ALL"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("UNREAD")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            filter === "UNREAD"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:bg-muted"
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-xs text-muted-foreground">Loading notifications...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Bell className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-base text-foreground">No notifications to show</h3>
          <p className="text-xs text-muted-foreground">
            {filter === "UNREAD" ? "You have read all your notifications." : "You have no notifications in history."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.isRead && handleMarkSingle(item.id)}
              className={`p-5 rounded-2xl border transition-all ${
                !item.isRead
                  ? "bg-primary/[0.04] border-primary/40 shadow-xs"
                  : "bg-card border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!item.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
                </div>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(item.createdAt)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {item.message}
              </p>

              {item.ticketId && (
                <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                  <Link
                    href={`/tickets/${item.ticketId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Open Related Ticket</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>

                  {!item.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkSingle(item.id);
                      }}
                      className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
