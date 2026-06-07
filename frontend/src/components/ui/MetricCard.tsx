import { type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/utils/cn";

export type MetricVariant = "primary" | "success" | "warning" | "danger" | "info";
export type ChipType = "positive" | "negative" | "neutral" | "warning" | "danger" | "info";

export interface MetricCardChip {
  label: string;
  type?: ChipType;
}

export interface MetricCardProps {
  label:    string;
  value:    string | number;
  icon:     LucideIcon;
  sub?:     string;
  chip?:    MetricCardChip;
  href?:    string;
  variant?: MetricVariant;
  className?: string;
}

const variants: Record<MetricVariant, { iconBg: string; iconColor: string; topBorder: string }> = {
  primary: { iconBg: "#EBF5FF", iconColor: "#3B96E8", topBorder: "#3B96E8" },
  success: { iconBg: "#ECFDF3", iconColor: "#12B76A", topBorder: "#12B76A" },
  warning: { iconBg: "#FFFAEB", iconColor: "#F79009", topBorder: "#F79009" },
  danger:  { iconBg: "#FEF3F2", iconColor: "#F04438", topBorder: "#F04438" },
  info:    { iconBg: "#EBF5FF", iconColor: "#3B96E8", topBorder: "#3B96E8" },
};

const chipStyles: Record<ChipType, { bg: string; color: string }> = {
  positive: { bg: "#ECFDF3", color: "#0A6B41" },
  negative: { bg: "#FEF3F2", color: "#B42318" },
  neutral:  { bg: "#F2F5F9", color: "#5A6677" },
  warning:  { bg: "#FFFAEB", color: "#92500A" },
  danger:   { bg: "#FEF3F2", color: "#B42318" },
  info:     { bg: "#EBF5FF", color: "#1A5FA3" },
};

function CardInner({ label, value, icon: Icon, sub, chip, variant = "primary", isLink }: MetricCardProps & { isLink?: boolean }) {
  const v  = variants[variant];
  const cs = chip ? chipStyles[chip.type ?? "neutral"] : null;

  return (
    <div
      style={{
        position: "relative",
        background: "#FFFFFF",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        boxShadow: "var(--shadow-card)",
        padding: "16px 20px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        overflow: "hidden",
        cursor: isLink ? "pointer" : undefined,
        transition: isLink ? "box-shadow 0.15s, border-color 0.15s, transform 0.15s" : undefined,
      }}
      className={cn(isLink && "hover:border-[var(--color-primary-border)]")}
      onMouseEnter={isLink ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(59,150,232,0.08), 0 1px 3px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      } : undefined}
      onMouseLeave={isLink ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      } : undefined}
    >
      {/* Top accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: v.topBorder, borderRadius: "16px 16px 0 0" }} />

      {/* Row 1: icon badge + chip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: v.iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={17} style={{ color: v.iconColor }} />
        </div>
        {cs && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: cs.color, background: cs.bg,
            padding: "3px 8px", borderRadius: 20,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}>
            {chip!.label}
          </span>
        )}
      </div>

      {/* Value */}
      <p style={{
        fontSize: "1.875rem",
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: "-0.025em",
        color: "var(--color-text-heading)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </p>

      {/* Label + sub */}
      <div>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.055em",
          color: "var(--color-text-muted)",
          lineHeight: 1.3,
        }}>
          {label}
        </p>
        {sub && (
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2, lineHeight: 1.4 }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export function MetricCard(props: MetricCardProps) {
  const { href, className } = props;
  if (href) {
    return (
      <Link to={href} className={cn("block", className)} style={{ textDecoration: "none" }}>
        <CardInner {...props} isLink />
      </Link>
    );
  }
  return <div className={className}><CardInner {...props} /></div>;
}
