import { Activity } from "lucide-react";

export interface ActivityItem {
  id: string | number;
  text: string;
  time: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

const dotColor: Record<string, string> = {
  default: "var(--color-text-disabled)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger:  "var(--color-danger)",
  info:    "var(--color-primary)",
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <div className="h-8 w-8 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center mb-2">
          <Activity size={14} className="text-[var(--color-text-muted)]" />
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">No recent activity</p>
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex gap-3 py-2.5 border-b border-[var(--color-border)] last:border-b-0"
        >
          <div
            className="mt-1.5 h-2 w-2 rounded-full shrink-0"
            style={{ background: dotColor[item.variant ?? "default"] }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--color-text-primary)] leading-snug">{item.text}</p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] shrink-0 mt-0.5 whitespace-nowrap">
            {item.time}
          </p>
        </div>
      ))}
    </div>
  );
}
