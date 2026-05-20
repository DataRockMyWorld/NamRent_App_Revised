import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : "?";
  const roleName = user?.role.replace(/_/g, " ") ?? "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 px-2 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-subtle)] transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-xs font-semibold shrink-0">
          {initials}
        </div>
        <div className="hidden md:block text-left min-w-0">
          <p className="text-[0.8125rem] font-semibold text-[var(--color-text-heading)] truncate max-w-[120px] leading-tight">
            {user?.full_name}
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[120px] capitalize leading-tight">
            {roleName.toLowerCase()}
          </p>
        </div>
        <ChevronDown size={12} className="text-[var(--color-text-muted)] shrink-0 hidden md:block" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <p className="text-sm font-semibold text-[var(--color-text-heading)]">{user?.full_name}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 capitalize">{roleName.toLowerCase()}</p>
          </div>
          <div className="p-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-tint)] transition-colors"
            >
              <LogOut size={14} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
