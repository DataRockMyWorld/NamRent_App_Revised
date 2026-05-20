import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import type { Notification, PaginatedResponse } from "@/types";
import { Button, PageLoader, EmptyState } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatDistanceToNow } from "date-fns";

export default function NotificationListPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Notification>>("/notifications/", { params: { limit: 50 } })
        .then((r) => r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/mark_read/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiClient.post("/notifications/mark_all_read/"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isLoading) return <PageLoader />;

  const notifications = data?.results ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            loading={markAllMutation.isPending}
          >
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up."
        />
      ) : (
        <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 p-4 transition-colors",
                !n.is_read && "bg-[var(--color-primary)]/5"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  n.is_read
                    ? "bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]"
                    : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                )}
              >
                <Bell size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", !n.is_read && "font-semibold text-[var(--color-text-primary)]")}>
                  {n.title}
                </p>
                <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{n.body}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markReadMutation.mutate(n.id)}
                  className="shrink-0 rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                  title="Mark as read"
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
