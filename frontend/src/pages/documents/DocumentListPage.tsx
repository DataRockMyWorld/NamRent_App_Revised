import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, AlertTriangle, FileText, Download, Search, X } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import type { PaginatedResponse } from "@/types";
import { Badge, ListPageSkeleton } from "@/components/ui";
import { format } from "date-fns";

interface Document {
  id: string;
  title: string;
  category: string;
  file_url: string;
  status: string;
  expiry_date: string | null;
  uploaded_by_name: string;
  created_at: string;
}

const PAGE_SIZE = 20;
function labelify(s: string) { return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }

function documentStatusVariant(status: string) {
  if (status === "ACTIVE" || status === "APPROVED") return "success" as const;
  if (status === "EXPIRING_SOON") return "warning" as const;
  if (status === "EXPIRED") return "danger" as const;
  return "default" as const;
}

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

function DocumentRow({ d, isLast }: { d: Document; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);
  const now = new Date();
  const isExpiringSoon = d.expiry_date
    ? (() => { const days = (new Date(d.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24); return days >= 0 && days <= 30; })()
    : false;

  return (
    <tr style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border)", background: hovered ? "var(--color-bg-hover)" : "transparent", transition: "background 0.1s" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <td style={tdStyle}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-heading)" }}>{d.title}</span>
      </td>
      <td style={tdStyle}><span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{labelify(d.category)}</span></td>
      <td style={tdStyle}><Badge variant={documentStatusVariant(d.status)}>{labelify(d.status)}</Badge></td>
      <td style={tdStyle}>
        {d.expiry_date ? (
          <span style={{ fontSize: 13, color: isExpiringSoon ? "#F79009" : "var(--color-text-muted)", fontWeight: isExpiringSoon ? 600 : 400 }}>
            {format(new Date(d.expiry_date), "d MMM yyyy")}
            {isExpiringSoon && <span style={{ fontSize: 11, marginLeft: 6, color: "#F79009" }}>· Soon</span>}
          </span>
        ) : (
          <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>—</span>
        )}
      </td>
      <td style={tdStyle}><span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{d.uploaded_by_name}</span></td>
      <td style={tdStyle}><span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{format(new Date(d.created_at), "d MMM yyyy")}</span></td>
      <td style={tdStyle}>
        <a href={d.file_url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: "var(--color-primary)", textDecoration: "none" }} className="hover:underline">
          <Download size={13} /> Download
        </a>
      </td>
    </tr>
  );
}

function EmptyCard({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div style={{ padding: "80px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EBF5FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <FolderOpen size={24} style={{ color: "#3B96E8" }} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-heading)", marginBottom: 10 }}>{isFiltered ? "No matching documents" : "No documents uploaded yet"}</p>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.65, maxWidth: 400 }}>
        {isFiltered ? "Try adjusting your search to find what you're looking for." : "Documents attached to contracts, vehicles, and clients will appear here."}
      </p>
    </div>
  );
}

export default function DocumentListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const hasActiveFilters = search !== "";

  const { data, isLoading } = useQuery({
    queryKey: ["documents", page, search],
    queryFn: () => apiClient.get<PaginatedResponse<Document>>("/documents/", { params: { page, search: search || undefined, page_size: PAGE_SIZE } }).then(r => r.data),
  });

  if (isLoading) return <ListPageSkeleton columns={7} stats={2} />;
  const docs       = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const now = new Date();
  const expiringCount = docs.filter(d => {
    if (!d.expiry_date) return false;
    const days = (new Date(d.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  }).length;

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 27, fontWeight: 600, color: "var(--color-text-heading)", letterSpacing: "-0.022em", lineHeight: 1.2 }}>Documents</h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 5, lineHeight: 1.5 }}>View and download documents linked to fleet contracts, clients, and vehicles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ListStatCard icon={FolderOpen}    label="Total Documents"  value={totalCount}      sub={totalCount === 0 ? "No documents on file" : "stored documents"}                              accentColor="#3B96E8" iconBg="#EBF5FF" iconColor="#3B96E8" />
        <ListStatCard icon={FileText}      label="This Page"        value={docs.length}     sub={docs.length === 0 ? "No results" : `of ${totalCount.toLocaleString()} total`}                accentColor="#8A9AB0" iconBg="#F2F5F9" iconColor="#8A9AB0" />
        <ListStatCard icon={AlertTriangle} label="Expiring Soon"    value={expiringCount}   sub={expiringCount > 0 ? "expiring within 30 days (this page)" : "No documents expiring soon"}   accentColor={expiringCount > 0 ? "#F79009" : "#8A9AB0"} iconBg={expiringCount > 0 ? "#FFFAEB" : "#F2F5F9"} iconColor={expiringCount > 0 ? "#F79009" : "#8A9AB0"} />
        <ListStatCard icon={FolderOpen}    label="With Expiry"      value={docs.filter(d => d.expiry_date).length} sub="documents on this page with expiry dates" accentColor="#3B96E8" iconBg="#EBF5FF" iconColor="#3B96E8" />
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 14, boxShadow: "var(--shadow-card)", padding: "14px 18px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 300 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search document title, category…" style={{ width: "100%", height: 38, paddingInline: "36px 32px", borderRadius: 10, border: "1px solid var(--color-border)", background: search ? "#fff" : "var(--color-bg-subtle)", fontSize: 13, fontFamily: "inherit", color: "var(--color-text-primary)", outline: "none", transition: "border-color 0.15s, background 0.15s" }} onFocus={e => { e.currentTarget.style.borderColor = "#3B96E8"; e.currentTarget.style.background = "#fff"; }} onBlur={e => { e.currentTarget.style.borderColor = "var(--color-border)"; if (!search) e.currentTarget.style.background = "var(--color-bg-subtle)"; }} />
            {search && <button onClick={() => { setSearch(""); setPage(1); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}><X size={13} /></button>}
          </div>
          {hasActiveFilters && <button onClick={() => { setSearch(""); setPage(1); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 38, paddingInline: 12, borderRadius: 10, background: "none", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "color 0.12s, border-color 0.12s" }} onMouseEnter={e => { e.currentTarget.style.color = "var(--color-danger)"; e.currentTarget.style.borderColor = "var(--color-danger)"; }} onMouseLeave={e => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.borderColor = "var(--color-border)"; }}><X size={12} /> Clear filters</button>}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{totalCount.toLocaleString()} document{totalCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 16, boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
        {docs.length === 0 ? <EmptyCard isFiltered={hasActiveFilters} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Expiry</th>
                  <th style={thStyle}>Uploaded By</th>
                  <th style={thStyle}>Date</th>
                  <th style={{ ...thStyle, width: 90 }} />
                </tr>
              </thead>
              <tbody>{docs.map((d, i) => <DocumentRow key={d.id} d={d} isLast={i === docs.length - 1} />)}</tbody>
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
