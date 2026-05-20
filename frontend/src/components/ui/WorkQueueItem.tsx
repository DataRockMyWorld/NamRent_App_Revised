import { type LucideIcon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";

type WorkQueueVariant = "critical" | "warning" | "info" | "default";

interface WorkQueueItemProps {
  icon: LucideIcon;
  label: string;
  count: number;
  href: string;
  variant?: WorkQueueVariant;
}

const variantStyles: Record<WorkQueueVariant, {
  borderColor: string;
  iconColor: string;
  iconBg: string;
  countBg: string;
  countColor: string;
}> = {
  critical: {
    borderColor: "var(--color-danger)",
    iconBg: "var(--color-danger-tint)",
    iconColor: "var(--color-danger)",
    countBg: "var(--color-danger-tint)",
    countColor: "var(--color-danger)",
  },
  warning: {
    borderColor: "var(--color-warning)",
    iconBg: "var(--color-warning-tint)",
    iconColor: "var(--color-warning)",
    countBg: "var(--color-warning-tint)",
    countColor: "var(--color-warning)",
  },
  info: {
    borderColor: "var(--color-primary)",
    iconBg: "var(--color-info-tint)",
    iconColor: "var(--color-info)",
    countBg: "var(--color-info-tint)",
    countColor: "var(--color-info)",
  },
  default: {
    borderColor: "var(--color-border)",
    iconBg: "var(--color-bg-subtle)",
    iconColor: "var(--color-text-muted)",
    countBg: "var(--color-bg-subtle)",
    countColor: "var(--color-text-muted)",
  },
};

export function WorkQueueItem({ icon: Icon, label, count, href, variant = "default" }: WorkQueueItemProps) {
  const s = variantStyles[variant];

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors",
        "border-b border-[var(--color-border)] last:border-b-0",
        "border-l-[3px]"
      )}
      style={{ borderLeftColor: s.borderColor }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)]"
        style={{ background: s.iconBg, color: s.iconColor }}
      >
        <Icon size={14} />
      </div>
      <span className="flex-1 text-sm text-[var(--color-text-primary)]">{label}</span>
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full min-w-[24px] text-center"
        style={{ background: s.countBg, color: s.countColor }}
      >
        {count}
      </span>
      <ArrowRight size={13} className="text-[var(--color-text-muted)]" />
    </Link>
  );
}
