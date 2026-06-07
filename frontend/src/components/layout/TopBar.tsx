import { Menu, Search } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

export function TopBar() {
  const { setDrawerOpen } = useUIStore();

  return (
    <header
      style={{
        height: 72,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 8,
        paddingInline: "24px",
        background: "#FFFFFF",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Mobile hamburger */}
      <button
        className="lg:hidden"
        onClick={() => setDrawerOpen(true)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 38, height: 38, borderRadius: 9,
          background: "none", border: "none", cursor: "pointer",
          color: "var(--color-text-muted)",
          flexShrink: 0,
          transition: "background 0.12s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(13,25,38,0.05)")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}
      >
        <Menu size={20} />
      </button>

      <div style={{ flex: 1 }} />

      {/* Search */}
      <button
        className="hidden sm:flex"
        style={{
          alignItems: "center",
          gap: 10,
          height: 38,
          paddingInline: 14,
          borderRadius: 10,
          border: "1px solid var(--color-border)",
          background: "var(--color-bg-subtle)",
          color: "var(--color-text-muted)",
          cursor: "text",
          width: 300,
          maxWidth: 340,
          transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#D0D8E4"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
        onFocus={e => {
          e.currentTarget.style.borderColor = "var(--color-primary)";
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,150,232,0.10)";
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = "var(--color-border)";
          e.currentTarget.style.background = "var(--color-bg-subtle)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <Search size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
        <span style={{ flex: 1, textAlign: "left", fontSize: 13, color: "var(--color-text-muted)" }}>
          Search vehicles, clients…
        </span>
        <kbd style={{
          fontSize: 10, fontFamily: "var(--font-mono)",
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 5, padding: "2px 6px",
          color: "var(--color-text-disabled)",
          lineHeight: 1.4,
        }}>
          ⌘K
        </kbd>
      </button>

      {/* Right icons */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
