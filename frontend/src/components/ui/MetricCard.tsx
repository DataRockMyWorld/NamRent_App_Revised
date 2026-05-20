import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";

type MetricVariant = "primary" | "success" | "warning" | "danger" | "info" | "purple";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  sub?: string;
  href?: string;
  variant?: MetricVariant;
  className?: string;
}

const variantStyles: Record<MetricVariant, { stripeColor: string; iconColor: string }> = {
  primary: { stripeColor: "var(--color-stripe-primary)", iconColor: "var(--color-primary)" },
  success: { stripeColor: "var(--color-stripe-success)", iconColor: "var(--color-success)" },
  warning: { stripeColor: "var(--color-stripe-warning)", iconColor: "var(--color-warning)" },
  danger:  { stripeColor: "var(--color-stripe-danger)",  iconColor: "var(--color-danger)" },
  info:    { stripeColor: "var(--color-stripe-primary)", iconColor: "var(--color-primary)" },
  purple:  { stripeColor: "var(--color-stripe-purple)",  iconColor: "var(--color-purple)" },
};

function CardInner({
  label, value, icon: Icon, trend, sub, variant = "primary", className, isLink,
}: MetricCardProps & { isLink?: boolean }) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "relative bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden",
        "flex flex-col",
        isLink && "hover:border-[var(--color-primary-border)] hover:shadow-[var(--shadow-sm)] transition-all duration-150 cursor-pointer",
        className
      )}
    >
      {/* Left accent stripe */}
      <div
        className="absolute left-0 inset-y-0 w-[3px]"
        style={{ background: styles.stripeColor }}
      />

      {/* Content */}
      <div className="px-5 py-4 pl-6 flex flex-col gap-2">
        {/* Icon + label row */}
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: styles.iconColor }} className="shrink-0" />
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {label}
          </p>
        </div>

        {/* Value */}
        <p
          className="text-[2rem] font-bold leading-none tracking-tight"
          style={{ color: "var(--color-text-heading)" }}
        >
          {value}
        </p>

        {/* Sub / trend */}
        {(trend || sub) && (
          <div className="flex items-center gap-1.5">
            {trend && (
              <>
                {trend.direction === "up" && (
                  <TrendingUp size={12} className="text-[var(--color-success)]" />
                )}
                {trend.direction === "down" && (
                  <TrendingDown size={12} className="text-[var(--color-danger)]" />
                )}
                <span
                  className="text-xs font-medium"
                  style={{
                    color:
                      trend.direction === "up"
                        ? "var(--color-success)"
                        : trend.direction === "down"
                        ? "var(--color-danger)"
                        : "var(--color-text-muted)",
                  }}
                >
                  {trend.value}
                </span>
              </>
            )}
            {sub && !trend && (
              <span className="text-xs text-[var(--color-text-muted)]">{sub}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function MetricCard(props: MetricCardProps) {
  const { href, className } = props;

  if (href) {
    return (
      <Link to={href} className={cn("block", className)}>
        <CardInner {...props} className={undefined} isLink />
      </Link>
    );
  }

  return <CardInner {...props} />;
}
