import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, ClipboardList, AlertTriangle, Wrench, CheckCircle,
  Search, X, ChevronDown,
} from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { MaintenanceRequest, PaginatedResponse } from "@/types";
import { Badge, maintenanceStatusVariant, priorityVariant, ListPageSkeleton, RowActions } from "@/components/ui";
import { format } from "date-fns";

const PAGE_SIZE = 20;

function labelify(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Compact stat card (shared list-page pattern) ─────────────────────────────
function ListStatCard({ icon: Icon, label, value, sub, accentColor, iconBg, iconColor }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  accentColor: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div style={{
      position: "relative",
      background: "#fff",
      border: "1px solid var(--color-border)",
      borderRadius: 14,
      boxShadow: "var(--shadow-card)",
      padding: "16px 18px 14px 20px",
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0, width: 3,
        background: accentColor,
      }} />
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: iconBg, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={15} style={{ color: iconColor }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: "1.375rem", fontWeight: 700, color: "var(--color-text-heading)",
          letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums",
        }}>
          {value}
        </p>
        <p style={{
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
          color: "var(--color-text-muted)", marginTop: 5, lineHeight: 1,
        }}>
          {label}
        </p>
        {sub && (
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4, lineHeight: 1.3 }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Filter select control ─────────────────────────────────────────────────────
function FilterSelect({ value, onChange, children }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          height: 38, paddingInline: "12px 30px", borderRadius: 10,
          border: "1px solid var(--color-border)",
          background: value ? "#fff" : "var(--color-bg-subtle)",
          color: value ? "var(--color-text-primary)" : "var(--color-text-muted)",
          fontSize: 13, fontFamily: "inherit",
          appearance: "none", cursor: "pointer", outline: "none",
          fontWeight: value ? 500 : 400,
          transition: "border-color 0.15s, background 0.15s",
        }}
        onFocus={e => { e.currentTarget.style.borderColor = "#3B96E8"; }}
        onBlur={e => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
      >
        {children}
      </select>
      <ChevronDown size={12} style={{
        position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
        color: "var(--color-text-muted)", pointerEvents: "none",
      }} />
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────
function MaintenanceEmptyState({ isFiltered, isClient }: { isFiltered: boolean; isClient: boolean }) {
  return (
    <div style={{
      padding: "80px 32px",
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%", background: "#FFFAEB",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
      }}>
        <Wrench size={24} style={{ color: "#F79009" }} />
      </div>
      <p style={{
        fontSize: 16, fontWeight: 600, color: "var(--color-text-heading)",
        marginBottom: 10, lineHeight: 1.3,
      }}>
        {isFiltered ? "No matching requests" : "No maintenance requests yet"}
      </p>
      <p style={{
        fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.65,
        maxWidth: 400, marginBottom: isClient && !isFiltered ? 28 : 0,
      }}>
        {isFiltered
          ? "Try adjusting your search or filter criteria to find what you're looking for."
          : isClient
            ? "Submit a maintenance request when a vehicle needs service, repair, or inspection."
            : "Maintenance requests submitted by clients will appear here for review and assignment."}
      </p>
      {isClient && !isFiltered && (
        <Link to="/maintenance/new" style={{ textDecoration: "none" }}>
          <button
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              height: 38, paddingInline: 16, borderRadius: 10,
              background: "#3B96E8", border: "none",
              color: "#fff", fontSize: 14, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 1px 2px rgba(59,150,232,0.2), 0 4px 12px rgba(59,150,232,0.15)",
              transition: "background 0.13s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#2878CC"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#3B96E8"; }}
          >
            <Plus size={15} />
            Submit a Request
          </button>
        </Link>
      )}
    </div>
  );
}

// ─── Table styles ──────────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: "10px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 700,
  color: "var(--color-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "13px 16px",
  verticalAlign: "middle",
};

function paginationBtn(disabled: boolean): React.CSSProperties {
  return {
    height: 34, paddingInline: 14, borderRadius: 8,
    background: disabled ? "var(--color-bg-subtle)" : "#fff",
    border: "1px solid var(--color-border)",
    color: disabled ? "var(--color-text-disabled)" : "var(--color-text-primary)",
    fontSize: 13, fontWeight: 500, fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}

// ─── Row component ─────────────────────────────────────────────────────────────
function MaintenanceRow({ r, isLast, isNamRent }: {
  r: MaintenanceRequest;
  isLast: boolean;
  isNamRent: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--color-border)",
        background: hovered ? "var(--color-bg-hover)" : "transparent",
        transition: "background 0.1s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Reference */}
      <td style={tdStyle}>
        <Link
          to={`/maintenance/${r.id}`}
          style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}
          className="hover:underline"
        >
          {r.reference_number}
        </Link>
      </td>

      {/* Vehicle */}
      <td style={tdStyle}>
        <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>
          {r.vehicle_display || "—"}
        </span>
      </td>

      {/* Type */}
      <td style={tdStyle}>
        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          {labelify(r.request_type)}
        </span>
      </td>

      {/* Priority */}
      <td style={tdStyle}>
        <Badge variant={priorityVariant(r.priority)}>
          {labelify(r.priority)}
        </Badge>
      </td>

      {/* Status */}
      <td style={tdStyle}>
        <Badge variant={maintenanceStatusVariant(r.status)}>
          {labelify(r.status)}
        </Badge>
      </td>

      {/* Client */}
      <td style={tdStyle}>
        <span style={{ fontSize: 13, color: r.client_name ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
          {r.client_name || "—"}
        </span>
      </td>

      {/* Submitted date */}
      <td style={tdStyle}>
        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          {format(new Date(r.created_at), "d MMM yyyy")}
        </span>
      </td>

      {/* Actions */}
      <td style={{ ...tdStyle, paddingInline: 8 }}>
        <RowActions actions={[
          { label: "View", to: `/maintenance/${r.id}` },
          ...(isNamRent ? [{ label: "Edit", to: `/maintenance/${r.id}/edit` }] : []),
        ]} />
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Maintenance List Page
// ─────────────────────────────────────────────────────────────────────────────
export default function MaintenanceListPage() {
  const user = useAuthStore((s) => s.user);
  const isClient  = !!(user?.role && ["CLIENT_ADMIN", "CLIENT_USER"].includes(user.role));
  const isNamRent = !!(user?.role && ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"].includes(user.role));

  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage]         = useState(1);

  const hasActiveFilters = search !== "" || status !== "" || priority !== "";

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance", page, search, status, priority],
    queryFn: () =>
      apiClient.get<PaginatedResponse<MaintenanceRequest>>("/maintenance/", {
        params: {
          page,
          search:   search   || undefined,
          status:   status   || undefined,
          priority: priority || undefined,
          page_size: PAGE_SIZE,
        },
      }).then(r => r.data),
  });

  const criticalQ = useQuery({
    queryKey: ["maintenance-stat", "critical"],
    queryFn:  () => apiClient.get<PaginatedResponse<MaintenanceRequest>>("/maintenance/", { params: { priority: "CRITICAL",    page_size: 1 } }).then(r => r.data.count),
  });
  const inProgressQ = useQuery({
    queryKey: ["maintenance-stat", "open"],
    queryFn:  () => apiClient.get<PaginatedResponse<MaintenanceRequest>>("/maintenance/", { params: { status: "IN_PROGRESS", page_size: 1 } }).then(r => r.data.count),
  });
  const completedQ = useQuery({
    queryKey: ["maintenance-stat", "completed"],
    queryFn:  () => apiClient.get<PaginatedResponse<MaintenanceRequest>>("/maintenance/", { params: { status: "COMPLETED",   page_size: 1 } }).then(r => r.data.count),
  });

  if (isLoading) return <ListPageSkeleton columns={8} stats={4} />;

  const requests   = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const criticalCount   = criticalQ.data ?? 0;
  const inProgressCount = inProgressQ.data ?? 0;
  const completedCount  = completedQ.data ?? 0;

  function clearFilters() {
    setSearch(""); setStatus(""); setPriority(""); setPage(1);
  }

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── 1. Page Header ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{
            fontSize: 27, fontWeight: 600, color: "var(--color-text-heading)",
            letterSpacing: "-0.022em", lineHeight: 1.2,
          }}>
            Maintenance
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 5, lineHeight: 1.5 }}>
            Track service requests, repairs, inspections, and maintenance assignments.
          </p>
        </div>
        {isClient && (
          <div style={{ flexShrink: 0, marginTop: 3 }}>
            <Link to="/maintenance/new" style={{ textDecoration: "none" }}>
              <button
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  height: 38, paddingInline: 14, borderRadius: 10,
                  background: "#3B96E8", border: "none",
                  color: "#fff", fontSize: 14, fontWeight: 500,
                  cursor: "pointer", fontFamily: "inherit",
                  boxShadow: "0 1px 2px rgba(59,150,232,0.2), 0 4px 12px rgba(59,150,232,0.15)",
                  transition: "background 0.13s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#2878CC"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#3B96E8"; }}
              >
                <Plus size={15} />
                New Request
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* ── 2. Summary Stat Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ListStatCard
          icon={ClipboardList}
          label="Total Requests"
          value={totalCount}
          sub={totalCount === 0 ? "No requests recorded" : "all maintenance records"}
          accentColor="#3B96E8"
          iconBg="#EBF5FF"
          iconColor="#3B96E8"
        />
        <ListStatCard
          icon={AlertTriangle}
          label="Critical"
          value={criticalCount}
          sub={criticalCount > 0 ? "requires immediate attention" : "No critical issues"}
          accentColor="#F04438"
          iconBg="#FEF3F2"
          iconColor="#F04438"
        />
        <ListStatCard
          icon={Wrench}
          label="In Progress"
          value={inProgressCount}
          sub={inProgressCount > 0
            ? `${inProgressCount} active service${inProgressCount === 1 ? "" : "s"}`
            : "No active services"}
          accentColor="#F79009"
          iconBg="#FFFAEB"
          iconColor="#F79009"
        />
        <ListStatCard
          icon={CheckCircle}
          label="Completed"
          value={completedCount}
          sub={completedCount > 0 ? "successfully resolved" : "No completions yet"}
          accentColor="#12B76A"
          iconBg="#ECFDF3"
          iconColor="#12B76A"
        />
      </div>

      {/* ── 3. Filter Bar ──────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        border: "1px solid var(--color-border)",
        borderRadius: 14,
        boxShadow: "var(--shadow-card)",
        padding: "14px 18px",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>

          {/* Search input */}
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 300 }}>
            <Search size={14} style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: "var(--color-text-muted)", pointerEvents: "none",
            }} />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search reference, vehicle, client…"
              style={{
                width: "100%", height: 38, paddingInline: "36px 32px",
                borderRadius: 10, border: "1px solid var(--color-border)",
                background: search ? "#fff" : "var(--color-bg-subtle)",
                fontSize: 13, fontFamily: "inherit", color: "var(--color-text-primary)",
                outline: "none", transition: "border-color 0.15s, background 0.15s",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = "#3B96E8";
                e.currentTarget.style.background = "#fff";
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                if (!search) e.currentTarget.style.background = "var(--color-bg-subtle)";
              }}
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", padding: 2,
                  display: "flex", alignItems: "center", color: "var(--color-text-muted)",
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <FilterSelect value={status} onChange={v => { setStatus(v); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </FilterSelect>

          {/* Priority filter */}
          <FilterSelect value={priority} onChange={v => { setPriority(v); setPage(1); }}>
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </FilterSelect>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                height: 38, paddingInline: 12, borderRadius: 10,
                background: "none", border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)", fontSize: 12, fontWeight: 500,
                cursor: "pointer", fontFamily: "inherit",
                transition: "color 0.12s, border-color 0.12s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "var(--color-danger)";
                e.currentTarget.style.borderColor = "var(--color-danger)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = "var(--color-text-muted)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <X size={12} />
              Clear filters
            </button>
          )}

          {/* Result count */}
          <span style={{
            marginLeft: "auto", fontSize: 12, color: "var(--color-text-muted)", whiteSpace: "nowrap",
          }}>
            {totalCount.toLocaleString()} request{totalCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── 4. Table Card ──────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        boxShadow: "var(--shadow-card)",
        overflow: "hidden",
      }}>
        {requests.length === 0 ? (
          <MaintenanceEmptyState isFiltered={hasActiveFilters} isClient={isClient} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={thStyle}>Reference</th>
                  <th style={thStyle}>Vehicle</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Priority</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Submitted</th>
                  <th style={{ ...thStyle, width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {requests.map((r, idx) => (
                  <MaintenanceRow
                    key={r.id}
                    r={r}
                    isLast={idx === requests.length - 1}
                    isNamRent={isNamRent}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. Pagination ──────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
            Showing {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(page * PAGE_SIZE, totalCount).toLocaleString()} of {totalCount.toLocaleString()}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button disabled={page === 1}        onClick={() => setPage(p => p - 1)} style={paginationBtn(page === 1)}>← Previous</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={paginationBtn(page === totalPages)}>Next →</button>
          </div>
        </div>
      )}

    </div>
  );
}
