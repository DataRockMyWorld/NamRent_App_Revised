import { differenceInDays } from "date-fns";
import { cn } from "@/utils/cn";

interface ExpiryRowProps {
  label: string;
  sub?: string;
  expiryDate: string | null;
}

function getDaysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return differenceInDays(new Date(dateStr), new Date());
}

function expiryColor(days: number | null): string {
  if (days === null) return "var(--color-text-muted)";
  if (days < 0) return "var(--color-danger)";
  if (days < 7) return "var(--color-danger)";
  if (days < 30) return "var(--color-warning)";
  return "var(--color-success)";
}

function expiryBg(days: number | null): string {
  if (days === null) return "transparent";
  if (days < 0) return "var(--color-danger-tint)";
  if (days < 7) return "var(--color-danger-tint)";
  if (days < 30) return "var(--color-warning-tint)";
  return "var(--color-success-tint)";
}

function expiryLabel(days: number | null, dateStr: string | null): string {
  if (!dateStr) return "—";
  if (days === null) return "—";
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function ExpiryRow({ label, sub, expiryDate }: ExpiryRowProps) {
  const days = getDaysLeft(expiryDate);
  const color = expiryColor(days);
  const bg = expiryBg(days);
  const timeLabel = expiryLabel(days, expiryDate);

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] last:border-b-0 gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{label}</p>
        {sub && <p className="text-xs text-[var(--color-text-muted)] truncate">{sub}</p>}
      </div>
      <span
        className={cn("text-xs font-semibold px-2.5 py-1 rounded-full shrink-0")}
        style={{ color, background: bg }}
      >
        {timeLabel}
      </span>
    </div>
  );
}
