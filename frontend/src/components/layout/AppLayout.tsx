import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { SessionTimeoutModal } from "@/components/ui/SessionTimeoutModal";

// ─── AppLayout ────────────────────────────────────────────────────────────────
// Sidebar is a flex item on desktop (sticky, in-flow) — NOT fixed.
// This means NO manual padding/margin compensation is needed on the main area.
// The sidebar's own width directly pushes the main content right.
// Mobile: sidebar becomes a fixed drawer (handled inside Sidebar.tsx).
export function AppLayout() {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--color-bg-app)" }}>
      {/* Desktop: sticky flex item. Mobile: fixed drawer. */}
      <Sidebar />

      {/* Main area — naturally starts after sidebar, no padding hack needed */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden" }}>
        <TopBar />
        <main style={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>

      <SessionTimeoutModal />
    </div>
  );
}
