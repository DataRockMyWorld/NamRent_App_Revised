import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/services/apiClient";
import type { PaginatedResponse, Notification } from "@/types";

export function NotificationBell() {
  const { data } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Notification>>("/notifications/", { params: { is_read: false, limit: 1 } })
        .then((r) => r.data.count),
    refetchInterval: 60_000,
  });

  const count = data ?? 0;

  return (
    <Link
      to="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
    >
      <Bell size={18} />
      {count > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
