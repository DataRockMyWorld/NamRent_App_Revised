import { cn } from "@/utils/cn";

type StatVariant = "default" | "primary" | "success" | "warning" | "danger";

export interface InlineStat {
  label: string;
  value: number | string;
  variant?: StatVariant;
}

interface InlineStatStripProps {
  stats: InlineStat[];
  className?: string;
}

const variantValueColor: Record<StatVariant, string> = {
  default: "var(--color-text-heading)",
  primary: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger:  "var(--color-danger)",
};

export function InlineStatStrip({ stats, className }: InlineStatStripProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-stretch gap-px bg-[var(--color-border)] border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden mb-5",
        className
      )}
    >
      {stats.map((stat, i) => (
        <div
          key={i}
          className="flex flex-col items-start px-4 py-3 bg-[var(--color-bg-surface)] flex-1 min-w-[80px]"
        >
          <span
            className="text-lg font-bold leading-none tabular-nums"
            style={{ color: variantValueColor[stat.variant ?? "default"] }}
          >
            {stat.value}
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] mt-1 whitespace-nowrap">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
