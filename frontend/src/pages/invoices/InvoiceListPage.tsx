import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Receipt, AlertTriangle, Clock, CheckCircle, Search, X, ChevronDown } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { Invoice, PaginatedResponse } from "@/types";
import { Badge, invoiceStatusVariant, ListPageSkeleton, RowActions } from "@/components/ui";
import { format } from "date-fns";

const PAGE_SIZE = 20;
function labelify(s: string) { return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "VIEWED", label: "Viewed" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
];

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

function InvoiceRow({ inv, isNamRent, isLast }: { inv: Invoice; isNamRent: boolean; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);
  const amount = parseFloat(inv.total_amount as unknown as string);
  return (
    <tr style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)", background: hovered ? "var(--color-bg-hover)" : "transparent", transition: "background 0.1s" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <td style={tdStyle}>
        <Link to={`/invoices/${inv.id}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }} className="hover:underline">{inv.invoice_number}</Link>
      </td>
      <td style={tdStyle}><span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>{inv.client_name}</span></td>
      <td style={tdStyle}><span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{format(new Date(inv.issue_date), "d MMM yyyy")}</span></td>
      <td style={tdStyle}><span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{format(new Date(inv.due_date), "d MMM yyyy")}</span></td>
      <td style={tdStyle}><span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>N$ {isNaN(amount) ? "—" : amount.toLocaleString()}</span></td>
      <td style={tdStyle}><Badge variant={invoiceStatusVariant(inv.status)}>{labelify(inv.status)}</Badge></td>
      <td style={{ ...tdStyle, paddingInline: 8 }}>
        <RowActions actions={[{ label: "View", to: `/invoices/${inv.id}` }, ...(isNamRent ? [{ label: "Edit", to: `/invoices/${inv.id}/edit` }] : [])]} />
      </td>
    </tr>
  );
}

function EmptyCard({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div style={{ padding: "80px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EBF5FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Receipt size={24} style={{ color: "#3B96E8" }} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-heading)", marginBottom: 10 }}>{isFiltered ? "No matching invoices" : "No invoices yet"}</p>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.65, maxWidth: 400 }}>
        {isFiltered ? "Try adjusting your search or filters to find what you're looking for." : "Invoices will appear here once they are created and issued to clients."}
      </p>
    </div>
  );
}

export default function InvoiceListPage() {
  const user = useAuthStore((s) => s.user);
  const isNamRent = !!(user?.role && ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"].includes(user.role));

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const hasActiveFilters = search !== "" || statusFilter !== "";

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", page, search, statusFilter],
    queryFn: () => apiClient.get<PaginatedResponse<Invoice>>("/invoices/", { params: { page, search: search || undefined, status: statusFilter || undefined, page_size: PAGE_SIZE } }).then(r => r.data),
  });
  const overdueQ = useQuery({ queryKey: ["invoices-stat", "overdue"], queryFn: () => apiClient.get<PaginatedResponse<Invoice>>("/invoices/", { params: { status: "OVERDUE", page_size: 1 } }).then(r => r.data.count) });
  const sentQ    = useQuery({ queryKey: ["invoices-stat", "sent"],    queryFn: () => apiClient.get<PaginatedResponse<Invoice>>("/invoices/", { params: { status: "SENT",    page_size: 1 } }).then(r => r.data.count) });
  const paidQ    = useQuery({ queryKey: ["invoices-stat", "paid"],    queryFn: () => apiClient.get<PaginatedResponse<Invoice>>("/invoices/", { params: { status: "PAID",    page_size: 1 } }).then(r => r.data.count) });

  if (isLoading) return <ListPageSkeleton columns={7} stats={4} />;
  const invoices   = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 600, color: "var(--color-text-heading)", letterSpacing: "-0.022em", lineHeight: 1.2 }}>Invoices</h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 5, lineHeight: 1.5 }}>Track billing, payment status, and invoice history for all clients.</p>
        </div>
        {isNamRent && (
          <div style={{ flexShrink: 0, marginTop: 3 }}>
            <Link to="/invoices/new" style={{ textDecoration: "none" }}>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 38, paddingInline: 14, borderRadius: 10, background: "#3B96E8", border: "none", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 1px 2px rgba(59,150,232,0.2), 0 4px 12px rgba(59,150,232,0.15)", transition: "background 0.13s", whiteSpace: "nowrap" }} onMouseEnter={e => { e.currentTarget.style.background = "#2878CC"; }} onMouseLeave={e => { e.currentTarget.style.background = "#3B96E8"; }}>
                <Plus size={15} /> New Invoice
              </button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ListStatCard icon={Receipt}        label="Total Invoices" value={totalCount}            sub={totalCount === 0 ? "No invoices issued" : "in billing history"}                   accentColor="#3B96E8" iconBg="#EBF5FF" iconColor="#3B96E8" />
        <ListStatCard icon={AlertTriangle}  label="Overdue"        value={overdueQ.data ?? 0}    sub={(overdueQ.data ?? 0) > 0 ? "past due date" : "No overdue invoices"}              accentColor="#F04438" iconBg="#FEF3F2" iconColor="#F04438" />
        <ListStatCard icon={Clock}          label="Sent / Pending" value={sentQ.data ?? 0}        sub={(sentQ.data ?? 0) > 0 ? "awaiting payment" : "No pending invoices"}              accentColor="#F79009" iconBg="#FFFAEB" iconColor="#F79009" />
        <ListStatCard icon={CheckCircle}    label="Paid"           value={paidQ.data ?? 0}        sub={(paidQ.data ?? 0) > 0 ? "fully settled" : "No paid invoices yet"}                accentColor="#12B76A" iconBg="#ECFDF3" iconColor="#12B76A" />
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, boxShadow: "var(--shadow-card)", padding: "14px 18px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 300 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search invoice number, client…" style={{ width: "100%", height: 38, paddingInline: "36px 32px", borderRadius: 10, border: "1px solid var(--color-border)", background: search ? "#fff" : "var(--color-bg-subtle)", fontSize: 13, fontFamily: "inherit", color: "var(--color-text-primary)", outline: "none", transition: "border-color 0.15s, background 0.15s" }} onFocus={e => { e.currentTarget.style.borderColor = "#3B96E8"; e.currentTarget.style.background = "#fff"; }} onBlur={e => { e.currentTarget.style.borderColor = "var(--color-border)"; if (!search) e.currentTarget.style.background = "var(--color-bg-subtle)"; }} />
            {search && <button onClick={() => { setSearch(""); setPage(1); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}><X size={13} /></button>}
          </div>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ height: 38, paddingInline: "12px 32px", borderRadius: 10, border: "1px solid var(--color-border)", background: statusFilter ? "#fff" : "var(--color-bg-subtle)", fontSize: 13, fontFamily: "inherit", color: statusFilter ? "var(--color-text-primary)" : "var(--color-text-muted)", outline: "none", appearance: "none", cursor: "pointer" }}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
          </div>
          {hasActiveFilters && <button onClick={() => { setSearch(""); setStatusFilter(""); setPage(1); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 38, paddingInline: 12, borderRadius: 10, background: "none", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "color 0.12s, border-color 0.12s" }} onMouseEnter={e => { e.currentTarget.style.color = "var(--color-danger)"; e.currentTarget.style.borderColor = "var(--color-danger)"; }} onMouseLeave={e => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.borderColor = "var(--color-border)"; }}><X size={12} /> Clear filters</button>}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{totalCount.toLocaleString()} invoice{totalCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 16, boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
        {invoices.length === 0 ? <EmptyCard isFiltered={hasActiveFilters} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={thStyle}>Invoice #</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Issue Date</th>
                  <th style={thStyle}>Due Date</th>
                  <th style={thStyle}>Total</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, width: 44 }} />
                </tr>
              </thead>
              <tbody>{invoices.map((inv, i) => <InvoiceRow key={inv.id} inv={inv} isNamRent={isNamRent} isLast={i === invoices.length - 1} />)}</tbody>
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
