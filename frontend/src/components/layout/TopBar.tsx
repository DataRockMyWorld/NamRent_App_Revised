import { Menu, Search } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

export function TopBar() {
  const { setDrawerOpen } = useUIStore();

  return (
    <header className="h-14 shrink-0 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-sm)] px-4">
      {/* Mobile hamburger */}
      <button
        className="lg:hidden flex items-center justify-center h-8 w-8 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)] transition-colors"
        onClick={() => setDrawerOpen(true)}
      >
        <Menu size={18} />
      </button>

      <div className="flex-1" />

      {/* Search bar */}
      <button className="hidden sm:flex items-center gap-2.5 h-9 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-primary-border)] hover:bg-white transition-colors min-w-[200px] max-w-[280px]">
        <Search size={14} className="shrink-0" />
        <span className="flex-1 text-left text-[0.8125rem]">Search vehicles, clients…</span>
        <kbd className="text-[10px] bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded px-1.5 py-0.5 font-mono text-[var(--color-text-disabled)]">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
