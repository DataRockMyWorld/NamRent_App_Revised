import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users, CheckCircle, MinusCircle, AlertTriangle, Search, X, ChevronDown } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import type { Dealer, PaginatedResponse } from "@/types";
import { Badge, ListPageSkeleton, RowActions } from "@/components/ui";

const PAGE_SIZE = 20;
function labelify(s: string) { return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }

function ListStatCard({ icon: Icon, label, value, sub, accentColor, iconBg, iconColor }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string;
  accentColor: string; iconBg: string; iconColor: string;
}) {
  return (
    <div style={{ position: "relative", background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, boxShadow: "var(--shadow-card)", padding: "16px 18px 14px 20px", display: "flex", alignItems: "flex-start", gap: 14, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 3, background: accentColor }} />
      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={15} style={{ color: iconColor }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-text-heading)", letterSpacing: "-0.02em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</p>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)", marginTop: 5, lineHeight: 1 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4, lineHeight: 1.3 }}>{sub}</p>}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" };
const tdStyle: React.CSSProperties = { padding: "13px 16px", verticalAlign: "middle" };
function paginationBtn(d: boolean): React.CSSProperties { return { height: 34, paddingInline: 14, borderRadius: 8, background: d ? "var(--color-bg-subtle)" : "#fff", border: "1px solid var(--color-border)", color: d ? "var(--color-text-disabled)" : "var(--color-text-primary)", fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: d ? "not-allowed" : "pointer", opacity: d ? 0.6 : 1 }; }

function DealerRow({ d, isLast }: { d: Dealer; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)", background: hovered ? "var(--color-bg-hover)" : "transparent", transition: "background 0.1s" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <td style={tdStyle}>
        <Link to={`/dealers/${d.id}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }} className="hover:underline">{d.dealer_name}</Link>
      </td>
      <td style={tdStyle}>
        <p style={{ fontSize: 13, color: "var(--color-text-primary)" }}>{d.contact_person}</p>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{d.email}</p>
      </td>
      <td style={tdStyle}><span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{d.city || "—"}</span></td>
      <td style={tdStyle}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {d.brands_supplied.slice(0, 3).map(b => (
            <span key={b} style={{ fontSize: 11, fontWeight: 500, background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: 20, padding: "2px 8px", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{b}</span>
          ))}
          {d.brands_supplied.length > 3 && (
            <span style={{ fontSize: 11, fontWeight: 500, background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: 20, padding: "2px 8px", color: "var(--color-text-muted)" }}>+{d.brands_supplied.length - 3}</span>
          )}
        </div>
      </td>
      <td style={tdStyle}>
        <Badge variant={d.dealer_status === "ACTIVE" ? "success" : d.dealer_status === "SUSPENDED" ? "warning" : "default"}>{labelify(d.dealer_status)}</Badge>
      </td>
      <td style={{ ...tdStyle, paddingInline: 8 }}>
        <RowActions actions={[{ label: "View", to: `/dealers/${d.id}` }, { label: "Edit", to: `/dealers/${d.id}/edit` }]} />
      </td>
    </tr>
  );
}

function EmptyCard({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div style={{ padding: "80px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EBF5FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Users size={24} style={{ color: "#3B96E8" }} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-heading)", marginBottom: 10 }}>{isFiltered ? "No matching dealers" : "No dealers added yet"}</p>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.65, maxWidth: 400, marginBottom: !isFiltered ? 28 : 0 }}>
        {isFiltered ? "Try adjusting your search to find what you're looking for." : "Add dealers to assign them to procurement requests and fleet sourcing."}
      </p>
      {!isFiltered && (
        <Link to="/dealers/new" style={{ textDecoration: "none" }}>
          <button style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 38, paddingInline: 16, borderRadius: 10, background: "#3B96E8", border: "none", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 2px rgba(59,150,232,0.2), 0 4px 12px rgba(59,150,232,0.15)", transition: "background 0.13s" }} onMouseEnter={e => { e.currentTarget.style.background = "#2878CC"; }} onMouseLeave={e => { e.currentTarget.style.background = "#3B96E8"; }}>
            <Plus size={15} /> Add Dealer
          </button>
        </Link>
      )}
    </div>
  );
}

export default function DealerListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);
  const hasActiveFilters    = search !== "";

  const { data, isLoading } = useQuery({
    queryKey: ["dealers", page, search],
    queryFn: () => apiClient.get<PaginatedResponse<Dealer>>("/dealers/", { params: { page, search: search || undefined, page_size: PAGE_SIZE } }).then(r => r.data),
  });
  const activeQ    = useQuery({ queryKey: ["dealers-stat", "active"],    queryFn: () => apiClient.get<PaginatedResponse<Dealer>>("/dealers/", { params: { dealer_status: "ACTIVE",    page_size: 1 } }).then(r => r.data.count) });
  const inactiveQ  = useQuery({ queryKey: ["dealers-stat", "inactive"],  queryFn: () => apiClient.get<PaginatedResponse<Dealer>>("/dealers/", { params: { dealer_status: "INACTIVE",  page_size: 1 } }).then(r => r.data.count) });
  const suspendedQ = useQuery({ queryKey: ["dealers-stat", "suspended"], queryFn: () => apiClient.get<PaginatedResponse<Dealer>>("/dealers/", { params: { dealer_status: "SUSPENDED", page_size: 1 } }).then(r => r.data.count) });

  if (isLoading) return <ListPageSkeleton columns={6} stats={4} />;
  const dealers    = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 600, color: "var(--color-text-heading)", letterSpacing: "-0.022em", lineHeight: 1.2 }}>Dealers</h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 5, lineHeight: 1.5 }}>Manage vehicle dealers, brand coverage, and assignment records.</p>
        </div>
        <div style={{ flexShrink: 0, marginTop: 3 }}>
          <Link to="/dealers/new" style={{ textDecoration: "none" }}>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 38, paddingInline: 14, borderRadius: 10, background: "#3B96E8", border: "none", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 2px rgba(59,150,232,0.2), 0 4px 12px rgba(59,150,232,0.15)", transition: "background 0.13s", whiteSpace: "nowrap" }} onMouseEnter={e => { e.currentTarget.style.background = "#2878CC"; }} onMouseLeave={e => { e.currentTarget.style.background = "#3B96E8"; }}>
              <Plus size={15} /> Add Dealer
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ListStatCard icon={Users}         label="Total Dealers" value={totalCount}            sub={totalCount === 0 ? "No dealers registered" : "in dealer network"}               accentColor="#3B96E8" iconBg="#EBF5FF" iconColor="#3B96E8" />
        <ListStatCard icon={CheckCircle}   label="Active"        value={activeQ.data ?? 0}     sub={(activeQ.data ?? 0) > 0 ? "available for procurement" : "No active dealers"}     accentColor="#12B76A" iconBg="#ECFDF3" iconColor="#12B76A" />
        <ListStatCard icon={MinusCircle}   label="Inactive"      value={inactiveQ.data ?? 0}   sub={(inactiveQ.data ?? 0) > 0 ? "not currently assigned" : "No inactive dealers"}    accentColor="#8A9AB0" iconBg="#F2F5F9" iconColor="#8A9AB0" />
        <ListStatCard icon={AlertTriangle} label="Suspended"     value={suspendedQ.data ?? 0}  sub={(suspendedQ.data ?? 0) > 0 ? "accounts suspended" : "No suspended accounts"}     accentColor="#F04438" iconBg="#FEF3F2" iconColor="#F04438" />
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, boxShadow: "var(--shadow-card)", padding: "14px 18px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 300 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search dealer name, city, brands…" style={{ width: "100%", height: 38, paddingInline: "36px 32px", borderRadius: 10, border: "1px solid var(--color-border)", background: search ? "#fff" : "var(--color-bg-subtle)", fontSize: 13, fontFamily: "inherit", color: "var(--color-text-primary)", outline: "none", transition: "border-color 0.15s, background 0.15s" }} onFocus={e => { e.currentTarget.style.borderColor = "#3B96E8"; e.currentTarget.style.background = "#fff"; }} onBlur={e => { e.currentTarget.style.borderColor = "var(--color-border)"; if (!search) e.currentTarget.style.background = "var(--color-bg-subtle)"; }} />
            {search && <button onClick={() => { setSearch(""); setPage(1); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}><X size={13} /></button>}
          </div>
          {hasActiveFilters && <button onClick={() => { setSearch(""); setPage(1); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 38, paddingInline: 12, borderRadius: 10, background: "none", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "color 0.12s, border-color 0.12s" }} onMouseEnter={e => { e.currentTarget.style.color = "var(--color-danger)"; e.currentTarget.style.borderColor = "var(--color-danger)"; }} onMouseLeave={e => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.borderColor = "var(--color-border)"; }}><X size={12} /> Clear filters</button>}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{totalCount.toLocaleString()} dealer{totalCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 16, boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
        {dealers.length === 0 ? <EmptyCard isFiltered={hasActiveFilters} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={thStyle}>Dealer</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>City</th>
                  <th style={thStyle}>Brands</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, width: 44 }} />
                </tr>
              </thead>
              <tbody>{dealers.map((d, i) => <DealerRow key={d.id} d={d} isLast={i === dealers.length - 1} />)}</tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Showing {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(page * PAGE_SIZE, totalCount).toLocaleString()} of {totalCount.toLocaleString()}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button disabled={page === 1}         onClick={() => setPage(p => p - 1)} style={paginationBtn(page === 1)}>← Previous</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={paginationBtn(page === totalPages)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
