interface StatRowProps {
  label: string;
  count: number;
  total?: number;
  color: string;
}

export function StatRow({ label, count, total, color }: StatRowProps) {
  const percentage = total && total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border)] last:border-b-0">
      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="flex-1 text-sm text-[var(--color-text-primary)]">{label}</span>
      <span className="text-sm font-bold text-[var(--color-text-heading)] shrink-0 min-w-[28px] text-right">
        {count}
      </span>
      {total !== undefined && (
        <div className="w-20 h-1.5 rounded-full bg-[var(--color-bg-subtle)] overflow-hidden shrink-0">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${percentage}%`, background: color }}
          />
        </div>
      )}
    </div>
  );
}
