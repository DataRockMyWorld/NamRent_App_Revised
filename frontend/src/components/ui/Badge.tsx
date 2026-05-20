import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva("badge", {
  variants: {
    variant: {
      default: "badge-default",
      success: "badge-success",
      warning: "badge-warning",
      danger: "badge-danger",
      info: "badge-info",
      purple: "badge-purple",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Typed status → variant maps for common models
export function vehicleStatusVariant(status: string): VariantProps<typeof badgeVariants>["variant"] {
  const map: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    ACTIVE: "success",
    PENDING_ONBOARDING: "warning",
    UNDER_MAINTENANCE: "info",
    OUT_OF_SERVICE: "danger",
    PENDING_TRADE_IN: "warning",
    RETURNED: "default",
    ARCHIVED: "default",
  };
  return map[status] ?? "default";
}

export function contractStatusVariant(status: string): VariantProps<typeof badgeVariants>["variant"] {
  const map: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    ACTIVE: "success",
    DRAFT: "default",
    PENDING_APPROVAL: "warning",
    SUSPENDED: "warning",
    EXPIRED: "danger",
    TERMINATED: "danger",
    RENEWED: "info",
  };
  return map[status] ?? "default";
}

export function maintenanceStatusVariant(status: string): VariantProps<typeof badgeVariants>["variant"] {
  const map: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    SUBMITTED: "info",
    UNDER_REVIEW: "warning",
    APPROVED: "success",
    ASSIGNED: "purple",
    IN_PROGRESS: "info",
    COMPLETED: "success",
    REJECTED: "danger",
    CANCELLED: "default",
  };
  return map[status] ?? "default";
}

export function invoiceStatusVariant(status: string): VariantProps<typeof badgeVariants>["variant"] {
  const map: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    DRAFT: "default",
    SENT: "info",
    VIEWED: "info",
    PARTIALLY_PAID: "warning",
    PAID: "success",
    OVERDUE: "danger",
    CANCELLED: "default",
  };
  return map[status] ?? "default";
}

export function kycStatusVariant(status: string): VariantProps<typeof badgeVariants>["variant"] {
  const map: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
  };
  return map[status] ?? "default";
}

export function priorityVariant(priority: string): VariantProps<typeof badgeVariants>["variant"] {
  const map: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    LOW: "default",
    MEDIUM: "info",
    HIGH: "warning",
    CRITICAL: "danger",
  };
  return map[priority] ?? "default";
}
