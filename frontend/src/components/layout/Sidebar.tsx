import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Car, Users, UserCog, Building2, Wrench,
  FileText, Receipt, ShoppingCart, ArrowLeftRight, ClipboardList,
  FolderOpen, BarChart3, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import type { UserRole } from "@/types";
import namrentLogo from "@/assets/namrent-logo.jpg";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Vehicles", to: "/vehicles", icon: Car, roles: ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS", "CLIENT_ADMIN", "CLIENT_USER"] },
      { label: "Service Requests", to: "/service-requests", icon: ClipboardList, roles: ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS", "CLIENT_ADMIN", "CLIENT_USER"] },
      { label: "Maintenance", to: "/maintenance", icon: Wrench },
      { label: "Documents", to: "/documents", icon: FolderOpen },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Clients", to: "/clients", icon: Building2, roles: ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"] },
      { label: "Dealers", to: "/dealers", icon: Users, roles: ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"] },
      { label: "Procurement", to: "/procurement", icon: ShoppingCart },
      { label: "Trade-ins", to: "/tradeins", icon: ArrowLeftRight },
      { label: "Contracts", to: "/contracts", icon: FileText, roles: ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS", "CLIENT_ADMIN"] },
      { label: "Invoices", to: "/invoices", icon: Receipt, roles: ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS", "CLIENT_ADMIN"] },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Reports", to: "/reports", icon: BarChart3, roles: ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"] },
      { label: "Users & Roles", to: "/users", icon: UserCog, roles: ["SUPER_ADMIN", "NAMRENT_ADMIN"] },
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const { user } = useAuthStore();
  const { drawerOpen, setDrawerOpen, sidebarCollapsed, toggleSidebar } = useUIStore();

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.roles || (user?.role && item.roles.includes(user.role))
    ),
  })).filter((g) => g.items.length > 0);

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : "?";

  return (
    <>
      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col",
          "bg-[var(--color-sidebar-bg)] border-r border-[var(--color-sidebar-border)]",
          "transition-all duration-200 ease-in-out",
          sidebarCollapsed ? "lg:w-14" : "lg:w-60",
          "lg:translate-x-0",
          drawerOpen ? "translate-x-0 w-60" : "-translate-x-full w-60"
        )}
      >
        {/* ── Logo / Workspace area (64px) ── */}
        <div
          className={cn(
            "flex items-center border-b border-[var(--color-sidebar-border)] shrink-0",
            sidebarCollapsed ? "h-16 justify-center px-0" : "h-16 px-4 gap-3"
          )}
        >
          {sidebarCollapsed ? (
            <img src={namrentLogo} alt="NamRent" className="h-8 w-8 rounded-[var(--radius-md)] object-cover" />
          ) : (
            <>
              <img src={namrentLogo} alt="NamRent" className="h-8 w-auto rounded-[var(--radius-md)] shrink-0 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] font-semibold text-[var(--color-text-heading)] truncate leading-tight">
                  NamRent Fleet
                </p>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest truncate leading-tight mt-0.5"
                  style={{ color: "var(--color-text-disabled)" }}
                >
                  Operations Portal
                </p>
              </div>
            </>
          )}
          {/* Mobile close */}
          <button
            className="ml-auto lg:hidden text-[var(--color-sidebar-text-muted)] hover:text-[var(--color-text-primary)] p-1"
            onClick={() => setDrawerOpen(false)}
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-5">
              {!sidebarCollapsed && (
                <p className="section-label px-3 mb-1.5">{group.label}</p>
              )}
              {sidebarCollapsed && (
                <div className="border-t border-[var(--color-border)] my-2 mx-2" />
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={sidebarCollapsed ? item.label : undefined}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-[var(--radius-md)] transition-all duration-150 mb-0.5",
                      sidebarCollapsed
                        ? "px-0 py-2 justify-center h-9 w-10 mx-auto"
                        : "px-3 h-9",
                      isActive
                        ? "bg-[var(--color-primary-tint)] text-[#1A60A8] font-semibold border-l-[3px] border-[var(--color-primary)]"
                        : "text-[var(--color-sidebar-text-muted)] hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-text-primary)] border-l-[3px] border-transparent"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={16}
                        className={cn(
                          "shrink-0",
                          isActive ? "text-[var(--color-primary)]" : "text-[var(--color-sidebar-text-muted)]"
                        )}
                      />
                      {!sidebarCollapsed && (
                        <span className="text-[0.8125rem]">{item.label}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ── User area (avatar + name + role only — logout is in TopBar UserMenu) ── */}
        <div className="border-t border-[var(--color-sidebar-border)] px-2 py-3">
          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-xs font-semibold">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-semibold text-[var(--color-text-heading)]">
                  {user.full_name}
                </p>
                <p className="truncate text-[10px] text-[var(--color-text-muted)] capitalize">
                  {user.role.replace(/_/g, " ").toLowerCase()}
                </p>
              </div>
            </div>
          )}

          {sidebarCollapsed && user && (
            <div className="flex justify-center">
              <div
                title={user.full_name}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-xs font-semibold"
              >
                {initials}
              </div>
            </div>
          )}
        </div>

        {/* ── Collapse toggle (desktop only) ── */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "hidden lg:flex items-center justify-center",
            "absolute -right-3 top-[72px] h-6 w-6 rounded-full",
            "bg-[var(--color-bg-surface)] border border-[var(--color-sidebar-border)]",
            "text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]",
            "transition-colors shadow-sm z-40"
          )}
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  );
}
