import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { SessionTimeoutModal } from "@/components/ui/SessionTimeoutModal";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/utils/cn";

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex h-screen bg-[var(--color-bg-app)]">
      <Sidebar />

      {/* Main area — offset by sidebar width */}
      <div
        className={cn(
          "flex flex-1 flex-col overflow-hidden transition-all duration-200",
          sidebarCollapsed ? "lg:pl-14" : "lg:pl-60"
        )}
      >
        <TopBar />

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <SessionTimeoutModal />
    </div>
  );
}
