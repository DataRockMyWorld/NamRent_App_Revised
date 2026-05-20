import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiClient } from "@/services/apiClient";
import type { ActivityLog, PaginatedResponse } from "@/types";
import { LoadingSpinner } from "./LoadingSpinner";

interface ActivityTimelineProps {
  /** Django content-type model name, e.g. "client", "vehicle", "maintenancerequest" */
  contentType: string;
  objectId: string;
}

export function ActivityTimeline({ contentType, objectId }: ActivityTimelineProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["activity", contentType, objectId],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<ActivityLog>>("/activity/", {
          params: { content_type__model: contentType, object_id: objectId, limit: 50 },
        })
        .then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  const logs = data?.results ?? [];

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)]">
          <Activity size={18} className="text-[var(--color-text-muted)]" />
        </div>
        <p className="text-sm font-medium text-[var(--color-text-primary)]">No activity yet</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Actions taken on this record will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-[var(--color-border)]" />

      <div className="space-y-0">
        {logs.map((log, i) => (
          <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Dot */}
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-primary)] border-2 border-[var(--color-border)]">
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: i === 0 ? "var(--color-primary)" : "var(--color-text-muted)",
                  opacity: i === 0 ? 1 : 0.5,
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 pt-1 min-w-0">
              <p className="text-sm text-[var(--color-text-primary)]">
                <span className="font-medium">
                  {log.actor_name ?? "System"}
                </span>{" "}
                <span className="text-[var(--color-text-secondary)]">{log.verb}</span>
              </p>
              {log.description && (
                <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{log.description}</p>
              )}
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
