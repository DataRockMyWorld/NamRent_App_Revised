import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Car, Users, UserCog, Building2, Wrench,
  FileText, Receipt, ShoppingCart, ArrowLeftRight, ClipboardList,
  FolderOpen, BarChart3, Settings, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import type { UserRole } from "@/types";

interface NavItem  { label: string; to: string; icon: React.ElementType; roles?: UserRole[] }
interface NavGroup { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard",        to: "/dashboard",        icon: LayoutDashboard },
      { label: "Vehicles",         to: "/vehicles",         icon: Car,           roles: ["SUPER_ADMIN","NAMRENT_ADMIN","NAMRENT_OPS","CLIENT_ADMIN","CLIENT_USER"] },
      { label: "Service Requests", to: "/service-requests", icon: ClipboardList, roles: ["SUPER_ADMIN","NAMRENT_ADMIN","NAMRENT_OPS","CLIENT_ADMIN","CLIENT_USER"] },
      { label: "Maintenance",      to: "/maintenance",      icon: Wrench },
      { label: "Documents",        to: "/documents",        icon: FolderOpen },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Clients",     to: "/clients",     icon: Building2,      roles: ["SUPER_ADMIN","NAMRENT_ADMIN","NAMRENT_OPS"] },
      { label: "Dealers",     to: "/dealers",     icon: Users,          roles: ["SUPER_ADMIN","NAMRENT_ADMIN","NAMRENT_OPS"] },
      { label: "Procurement", to: "/procurement", icon: ShoppingCart },
      { label: "Trade-ins",   to: "/tradeins",    icon: ArrowLeftRight },
      { label: "Contracts",   to: "/contracts",   icon: FileText,       roles: ["SUPER_ADMIN","NAMRENT_ADMIN","NAMRENT_OPS","CLIENT_ADMIN"] },
      { label: "Invoices",    to: "/invoices",    icon: Receipt,        roles: ["SUPER_ADMIN","NAMRENT_ADMIN","NAMRENT_OPS","CLIENT_ADMIN"] },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Reports",       to: "/reports",   icon: BarChart3, roles: ["SUPER_ADMIN","NAMRENT_ADMIN","NAMRENT_OPS"] },
      { label: "Users & Roles", to: "/users",     icon: UserCog,   roles: ["SUPER_ADMIN","NAMRENT_ADMIN"] },
      { label: "Settings",      to: "/settings",  icon: Settings },
    ],
  },
];

// ─── N mark logo ──────────────────────────────────────────────────────────────
function NMark({ size = 32 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.25),
      background: "#3B96E8", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width={size * 0.44} height={size * 0.44} viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2.5 9.5V2.5l4 5V2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ─── Shared body ──────────────────────────────────────────────────────────────
function SidebarBody({
  collapsed,
  onClose,
  onToggle,
  user,
  visibleGroups,
  initials,
}: {
  collapsed: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  user: ReturnType<typeof useAuthStore>["user"];
  visibleGroups: NavGroup[];
  initials: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        height: 72, display: "flex", alignItems: "center", flexShrink: 0,
        borderBottom: "1px solid var(--color-border)",
        padding: collapsed ? "0 16px" : "0 18px",
        justifyContent: collapsed ? "center" : undefined,
        gap: 10,
      }}>
        {collapsed ? (
          /* Collapsed header: just the N mark (clicking expands) */
          <button
            onClick={onToggle}
            title="Expand sidebar"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "6px 4px" }}
          >
            <NMark size={30} />
            <ChevronRight size={10} style={{ color: "#C4CAD4" }} />
          </button>
        ) : (
          <>
            <NMark size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-heading)", letterSpacing: "-0.012em", lineHeight: 1.3 }}>
                NamRent Fleet
              </p>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#C4CAD4", letterSpacing: "0.09em", textTransform: "uppercase", lineHeight: 1.4 }}>
                Operations Portal
              </p>
            </div>
            {/* Mobile close / desktop collapse */}
            {onClose ? (
              <button
                onClick={onClose}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 7, background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", flexShrink: 0 }}
                className="hover:bg-[rgba(13,25,38,0.04)]"
              >
                <X size={15} />
              </button>
            ) : (
              <button
                onClick={onToggle}
                title="Collapse sidebar"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 7, background: "none", border: "none", cursor: "pointer", color: "#C4CAD4", flexShrink: 0 }}
                className="hover:bg-[rgba(13,25,38,0.04)] hover:text-[var(--color-text-muted)]"
              >
                <ChevronLeft size={15} />
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav style={{
        flex: 1,
        overflowY: "auto", overflowX: "hidden",
        padding: collapsed ? "10px 8px" : "10px 10px",
      }}>
        {visibleGroups.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: 6, marginTop: gi === 0 ? 0 : 8 }}>
            {/* Group label */}
            {collapsed ? (
              gi > 0 && <div style={{ height: 1, background: "var(--color-border)", margin: "4px 4px 10px" }} />
            ) : (
              <p style={{
                fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.09em", color: "#C4CAD4",
                padding: "6px 10px 4px",
              }}>
                {group.label}
              </p>
            )}

            {/* Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  onClick={onClose}
                  style={{ textDecoration: "none" }}
                  className={({ isActive }) =>
                    cn(
                      "nav-item",
                      !collapsed && isActive  ? "nav-item-expanded-active" :
                      !collapsed && !isActive ? "nav-item-idle" :
                      collapsed  && isActive  ? "nav-item-active" :
                                                "nav-item-idle",
                      collapsed && "nav-item-collapsed"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* In collapsed mode, wrap icon in a soft circle when active */}
                      {collapsed ? (
                        <div style={{
                          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: isActive ? "rgba(59,150,232,0.1)" : "transparent",
                        }}>
                          <item.icon
                            size={17}
                            style={{ color: isActive ? "var(--color-primary)" : "#9BAAB8" }}
                          />
                        </div>
                      ) : (
                        <>
                          <item.icon
                            size={17}
                            style={{ flexShrink: 0, color: isActive ? "var(--color-primary)" : "#9BAAB8" }}
                          />
                          <span style={{
                            fontSize: 14,
                            fontWeight: isActive ? 500 : 400,
                            color: isActive ? "var(--color-primary)" : "#6B7A8D",
                          }}>
                            {item.label}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User area ───────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: "1px solid var(--color-border)",
        padding: collapsed ? "12px 8px" : "10px",
        flexShrink: 0,
      }}>
        {user && (collapsed ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              title={user.full_name}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--color-primary)", color: "white",
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "default",
              }}
            >
              {initials}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: "var(--color-primary)", color: "white",
              fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.full_name}
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "capitalize" }}>
                {user.role.replace(/_/g, " ").toLowerCase()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar() {
  const { user } = useAuthStore();
  const { drawerOpen, setDrawerOpen, sidebarCollapsed, toggleSidebar } = useUIStore();

  const visibleGroups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((item) => !item.roles || (user?.role && item.roles.includes(user.role))) }))
    .filter((g) => g.items.length > 0);

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  const shared = { user, visibleGroups, initials };

  return (
    <>
      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.32)", backdropFilter: "blur(2px)" }}
          className="lg:hidden"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className="lg:hidden"
        style={{
          position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50,
          width: 264,
          background: "var(--color-bg-surface)",
          borderRight: "1px solid var(--color-border)",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.22s ease-in-out",
          boxShadow: drawerOpen ? "4px 0 32px rgba(0,0,0,0.10)" : "none",
        }}
      >
        <SidebarBody {...shared} collapsed={false} onClose={() => setDrawerOpen(false)} />
      </aside>

      {/* Desktop sidebar — in flex flow, NOT fixed */}
      <aside
        className="hidden lg:block"
        style={{
          width: sidebarCollapsed ? 76 : 264,
          minWidth: sidebarCollapsed ? 76 : 264,
          height: "100vh",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          background: "var(--color-bg-surface)",
          borderRight: "1px solid var(--color-border)",
          transition: "width 0.22s ease-in-out, min-width 0.22s ease-in-out",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <SidebarBody {...shared} collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </aside>
    </>
  );
}
