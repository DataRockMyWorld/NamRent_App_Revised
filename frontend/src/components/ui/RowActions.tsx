import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

export interface RowAction {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: "default" | "danger";
}

interface RowActionsProps {
  actions: RowAction[];
}

export function RowActions({ actions }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)] transition-colors"
        aria-label="Row actions"
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] z-50 overflow-hidden py-1">
          {actions.map((action, i) =>
            action.to ? (
              <Link
                key={i}
                to={action.to}
                className="flex items-center w-full px-3 py-2 text-sm transition-colors hover:bg-[var(--color-bg-subtle)]"
                style={{ color: action.variant === "danger" ? "var(--color-danger)" : "var(--color-text-primary)" }}
                onClick={() => setOpen(false)}
              >
                {action.label}
              </Link>
            ) : (
              <button
                key={i}
                onClick={() => { action.onClick?.(); setOpen(false); }}
                className="flex items-center w-full px-3 py-2 text-sm transition-colors hover:bg-[var(--color-bg-subtle)] text-left"
                style={{ color: action.variant === "danger" ? "var(--color-danger)" : "var(--color-text-primary)" }}
              >
                {action.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
