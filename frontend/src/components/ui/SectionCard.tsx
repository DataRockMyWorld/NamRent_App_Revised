import { cn } from "@/utils/cn";

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?:       string;
  titleRight?:  React.ReactNode;
  description?: string;
  noPadding?:   boolean;
}

export function SectionCard({
  title, titleRight, description, noPadding, className, children, style, ...props
}: SectionCardProps) {
  return (
    <div
      className={cn(className)}
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
        ...style,
      }}
      {...props}
    >
      {(title || titleRight) && (
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "18px 22px 16px",
          borderBottom: "1px solid var(--color-border)",
          gap: 12,
        }}>
          <div>
            <h3 style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-text-heading)",
              lineHeight: 1.3,
              letterSpacing: "-0.008em",
            }}>
              {title}
            </h3>
            {description && (
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3, lineHeight: 1.5 }}>
                {description}
              </p>
            )}
          </div>
          {titleRight && (
            <div style={{ flexShrink: 0, marginTop: 1 }}>{titleRight}</div>
          )}
        </div>
      )}
      <div style={!noPadding ? { padding: "20px 22px" } : undefined}>
        {children}
      </div>
    </div>
  );
}
