import { cn } from "@/utils/cn";

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  titleRight?: React.ReactNode;
  description?: string;
  noPadding?: boolean;
}

export function SectionCard({
  title, titleRight, description, noPadding, className, children, ...props
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)]",
        className
      )}
      {...props}
    >
      {(title || titleRight) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--color-border)]">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-heading)]">{title}</h3>
            {description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>}
          </div>
          {titleRight && <div className="shrink-0">{titleRight}</div>}
        </div>
      )}
      <div className={cn(!noPadding && "p-5")}>{children}</div>
    </div>
  );
}
