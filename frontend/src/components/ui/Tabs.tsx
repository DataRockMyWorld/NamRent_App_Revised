import { cn } from "@/utils/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex gap-0 border-b border-[var(--color-border)] overflow-x-auto",
        "scrollbar-none",
        className
      )}
      style={{ scrollbarWidth: "none" }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap",
            "border-b-2 -mb-px transition-colors",
            active === tab.id
              ? "border-[var(--color-primary)] text-[var(--color-primary)]"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border)]"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-semibold",
                active === tab.id
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]"
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
