import { cn } from "@/utils/cn";

export interface QuickFact {
  label: string;
  value: React.ReactNode;
  hidden?: boolean;
}

interface QuickFactsProps {
  facts: QuickFact[];
  className?: string;
}

export function QuickFacts({ facts, className }: QuickFactsProps) {
  const visible = facts.filter((f) => !f.hidden && f.value != null && f.value !== "" && f.value !== undefined);
  if (!visible.length) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-2 py-4 border-b border-[var(--color-border)] mb-6",
        className
      )}
    >
      {visible.map((f, i) => (
        <div key={i} className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] shrink-0">
            {f.label}
          </span>
          <span className="text-xs font-semibold text-[var(--color-text-heading)] truncate">
            {f.value}
          </span>
        </div>
      ))}
    </div>
  );
}
