import { cn } from "@/utils/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, filters, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle mt-1">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {filters && <div className="mt-4">{filters}</div>}
    </div>
  );
}
