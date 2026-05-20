import { cn } from "@/utils/cn";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <span
      className={cn(
        "animate-spin rounded-full border-[var(--color-border)] border-t-[var(--color-primary)]",
        sizeMap[size],
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex h-full min-h-[300px] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
