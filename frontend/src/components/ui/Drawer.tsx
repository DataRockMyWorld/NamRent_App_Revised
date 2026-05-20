import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "md" | "lg" | "xl";
}

const widthMap = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Drawer({ open, onClose, title, description, children, footer, width = "lg" }: DrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Panel — slides in from right */}
      <div
        className={cn(
          "relative ml-auto flex flex-col h-full bg-[var(--color-bg-surface)]",
          "border-l border-[var(--color-border)] shadow-lg",
          "w-full",
          widthMap[width]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[var(--color-border)] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-heading)]">{title}</h2>
            {description && (
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-[var(--color-border)] px-6 py-4 shrink-0 bg-[var(--color-bg-subtle)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
