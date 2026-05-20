import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";

interface DetailHeaderProps {
  backTo: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function DetailHeader({
  backTo, backLabel = "Back", title, subtitle, badges, actions, className,
}: DetailHeaderProps) {
  return (
    <div
      className={cn(
        "bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)]",
        className
      )}
    >
      <div className="content-wrapper px-6 py-5">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mb-3"
        >
          <ArrowLeft size={13} />
          {backLabel}
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle mt-1">{subtitle}</p>}
            {badges && (
              <div className="flex flex-wrap items-center gap-2 mt-2">{badges}</div>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}
