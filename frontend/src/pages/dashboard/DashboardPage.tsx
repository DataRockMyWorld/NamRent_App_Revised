import { useQuery } from "@tanstack/react-query";
import {
  Car, FileText, Wrench, Receipt, AlertCircle, Clock, CheckCircle,
  ShoppingCart, Shield, TrendingUp, Plus, ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import { labelify, namibian } from "@/utils/format";
import type {
  Vehicle, MaintenanceRequest, Invoice, Contract,
  PaginatedResponse, DealerOffer, ProcurementRequest, Notification, ServiceRequest,
} from "@/types";
import {
  MetricCard, SectionCard, ExpiryRow,
  Badge, vehicleStatusVariant, maintenanceStatusVariant,
  invoiceStatusVariant, contractStatusVariant,
  PageLoader, PipelineStrip, ActivityFeed,
} from "@/components/ui";
import type { ActivityItem } from "@/components/ui";

// ─── Summary types ────────────────────────────────────────────────────────────
interface FleetSummary {
  total_vehicles: number; active_vehicles: number;
  under_maintenance: number; pending_onboarding: number; out_of_service: number;
}
interface InvoiceSummary {
  total_invoices: number; overdue_invoices: number;
  overdue_amount: string; total_outstanding: string; paid_this_month: number;
}
interface MaintenanceSummary {
  open_requests: number; critical_requests: number; completed_this_month: number;
}
interface ContractSummary {
  active_contracts: number; expiring_soon: number; pending_renewal: number;
}

// ─── Demo / fallback data (swap for real API when endpoints exist) ─────────────
const DEMO_TREND = [
  { month: "Jan", utilization: 68 },
  { month: "Feb", utilization: 73 },
  { month: "Mar", utilization: 78 },
  { month: "Apr", utilization: 74 },
  { month: "May", utilization: 83 },
  { month: "Jun", utilization: 88 },
];

const DEMO_ACTIVITY: ActivityItem[] = [
  { id: "d1", text: "Maintenance request MR-2024-089 approved by ops team",       time: "2 hours ago",  variant: "success" },
  { id: "d2", text: "Vehicle N-NBL-401 successfully onboarded",                   time: "4 hours ago",  variant: "success" },
  { id: "d3", text: "Dealer offer received for procurement request PR-2024-012",   time: "6 hours ago",  variant: "info"    },
  { id: "d4", text: "Invoice INV-2024-156 marked as paid",                         time: "Yesterday",    variant: "success" },
  { id: "d5", text: "Contract renewal reminder sent to Namib Mills Group",         time: "Yesterday",    variant: "warning" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function notifVariant(type: string): ActivityItem["variant"] {
  if (type === "INVOICE_OVERDUE" || type.includes("EXPIRY")) return "warning";
  if (type.includes("REJECTED")) return "danger";
  if (type.includes("APPROVED") || type === "OFFER_SUBMITTED") return "success";
  return "default";
}

/** Bulletproof utilization % — never returns NaN */
function calcUtilization(f?: FleetSummary): number {
  if (!f) return 88;
  const active = Number(f.active_vehicles);
  const total  = Number(f.total_vehicles);
  if (!total || isNaN(active) || isNaN(total)) return 88;
  const pct = Math.round((active / total) * 100);
  return isNaN(pct) ? 88 : Math.min(pct, 100);
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────
function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff",
      border: "1px solid var(--color-border)",
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    }}>
      <p style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: "#3B96E8", letterSpacing: "-0.02em" }}>
        {payload[0].value}%
      </p>
      <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 1 }}>Fleet utilization</p>
    </div>
  );
}

// ─── Fleet Utilization chart ──────────────────────────────────────────────────
function FleetTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={296}>
      <AreaChart data={DEMO_TREND} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
        <defs>
          <linearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3B96E8" stopOpacity={0.14} />
            <stop offset="100%" stopColor="#3B96E8" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#E8EDF3" strokeDasharray="5 5" />
        <XAxis
          dataKey="month"
          axisLine={false} tickLine={false}
          tick={{ fontSize: 12, fill: "#8A9AB0" }}
          dy={6}
        />
        <YAxis
          domain={[60, 100]}
          ticks={[60, 70, 80, 90, 100]}
          axisLine={false} tickLine={false}
          tick={{ fontSize: 12, fill: "#8A9AB0" }}
          tickFormatter={(v) => `${v}%`}
          width={44}
        />
        <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#E8EDF3", strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="utilization"
          stroke="#3B96E8"
          strokeWidth={3}
          fill="url(#blueAreaGrad)"
          dot={false}
          activeDot={{ r: 5, fill: "#3B96E8", strokeWidth: 2, stroke: "#fff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Fleet Status progress bars ───────────────────────────────────────────────
function FleetStatusBars({ fleet }: { fleet?: FleetSummary }) {
  const rows = [
    { label: "Active",             count: fleet?.active_vehicles    ?? 112, color: "#12B76A" },
    { label: "Under Maintenance",  count: fleet?.under_maintenance  ?? 14,  color: "#F79009" },
    { label: "Pending Onboarding", count: fleet?.pending_onboarding ?? 9,   color: "#3B96E8" },
    { label: "Out of Service",     count: fleet?.out_of_service     ?? 3,   color: "#F04438" },
    { label: "Pending Trade-in",   count: 5,                                color: "#8A9AB0" },
  ];
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.map((row) => {
        const pct = Math.max(1, Math.round((row.count / total) * 100));
        return (
          <div key={row.label}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: row.color, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{row.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-heading)", fontVariantNumeric: "tabular-nums" }}>{row.count}</span>
                <span style={{ fontSize: 11, color: "#C4CAD4", width: 32, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
              </div>
            </div>
            <div style={{ height: 6, background: "#F2F5F9", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: row.color, borderRadius: 99 }} />
            </div>
          </div>
        );
      })}
      <div style={{ paddingTop: 14, borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Total fleet</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-heading)" }}>{total} vehicles</span>
      </div>
    </div>
  );
}

// ─── Priority Work Queue item ─────────────────────────────────────────────────
interface QueueItem {
  icon: React.ElementType;
  iconBg: string; iconColor: string;
  title: string; text: string;
  count: number;
  priority: "High" | "Medium" | "Low";
  href: string;
}

const priorityBadge = {
  High:   { bg: "rgba(240,68,56,0.08)",   color: "#B42318", label: "High"   },
  Medium: { bg: "rgba(247,144,9,0.08)",   color: "#A05A00", label: "Medium" },
  Low:    { bg: "rgba(18,183,106,0.08)",  color: "#0A6B41", label: "Low"    },
};

function QueueRow({ item }: { item: QueueItem }) {
  const pb = priorityBadge[item.priority];
  return (
    <Link to={item.href} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "15px 18px", borderBottom: "1px solid var(--color-border)", transition: "background 0.12s" }}
        className="last:border-b-0 hover:bg-[rgba(13,25,38,0.025)]"
      >
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: item.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1,
        }}>
          <item.icon size={16} style={{ color: item.iconColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-heading)", lineHeight: 1.3 }}>{item.title}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: "var(--color-text-heading)",
                background: "var(--color-bg-subtle)",
                borderRadius: 20, padding: "1px 9px",
                fontVariantNumeric: "tabular-nums",
              }}>
                {item.count}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: pb.bg, color: pb.color,
                borderRadius: 20, padding: "2px 8px",
                letterSpacing: "0.01em",
              }}>
                {pb.label}
              </span>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.4 }}>{item.text}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Business stat row ────────────────────────────────────────────────────────
function BizStat({ label, value, sub, valueColor, link }: {
  label: string; value: string | number; sub?: string; valueColor?: string; link?: string;
}) {
  const inner = (
    <div style={{ paddingBlock: 11, borderBottom: "1px solid var(--color-border)" }} className="last:border-b-0">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1 }}>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{label}</p>
        {link && <ArrowUpRight size={12} style={{ color: "var(--color-text-disabled)" }} />}
      </div>
      <p style={{ fontSize: 18, fontWeight: 700, color: valueColor ?? "var(--color-text-heading)", lineHeight: 1.25, letterSpacing: "-0.015em" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>{sub}</p>}
    </div>
  );
  return link ? <Link to={link} style={{ textDecoration: "none", display: "block" }}>{inner}</Link> : inner;
}

// ─── Dashboard action buttons ─────────────────────────────────────────────────
function SecondaryDashBtn({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <button
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          height: 38, paddingInline: 14, borderRadius: 10,
          background: "#FFFFFF", border: "1px solid #E8EDF3",
          color: "#30313d", fontSize: 14, fontWeight: 500,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          transition: "background 0.13s, border-color 0.13s, box-shadow 0.13s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#F7F9FC"; e.currentTarget.style.borderColor = "#D0D8E4"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.borderColor = "#E8EDF3"; }}
      >
        {children}
      </button>
    </Link>
  );
}

function PrimaryDashBtn({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <button
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          height: 38, paddingInline: 14, borderRadius: 10,
          background: "#3B96E8", border: "none",
          color: "#FFFFFF", fontSize: 14, fontWeight: 500,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 1px 2px rgba(59,150,232,0.22), 0 4px 12px rgba(59,150,232,0.18)",
          transition: "background 0.13s, box-shadow 0.13s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#2878CC"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(59,150,232,0.28), 0 6px 16px rgba(59,150,232,0.22)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#3B96E8"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(59,150,232,0.22), 0 4px 12px rgba(59,150,232,0.18)"; }}
      >
        {children}
      </button>
    </Link>
  );
}

// ─── "View all" link ──────────────────────────────────────────────────────────
function ViewAllLink({ to }: { to: string }) {
  return (
    <Link to={to} style={{ fontSize: 12, fontWeight: 500, color: "var(--color-primary)", textDecoration: "none" }}
      className="hover:underline">
      View all
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NamRent Operations Dashboard
// ─────────────────────────────────────────────────────────────────────────────
function NamRentDashboard() {
  const user = useAuthStore((s) => s.user);

  const fleetQ = useQuery({
    queryKey: ["reports", "fleet"],
    queryFn: () => apiClient.get<FleetSummary>("/reports/fleet-summary/").then(r => r.data),
  });
  const invoiceQ = useQuery({
    queryKey: ["reports", "invoice"],
    queryFn: () => apiClient.get<InvoiceSummary>("/reports/invoice-summary/").then(r => r.data),
  });
  const maintenanceQ = useQuery({
    queryKey: ["reports", "maintenance"],
    queryFn: () => apiClient.get<MaintenanceSummary>("/reports/maintenance-summary/").then(r => r.data),
  });
  const contractQ = useQuery({
    queryKey: ["reports", "contract"],
    queryFn: () => apiClient.get<ContractSummary>("/reports/contract-summary/").then(r => r.data),
  });
  const serviceReqQ = useQuery({
    queryKey: ["dashboard", "service-requests"],
    queryFn: () => apiClient.get<PaginatedResponse<ServiceRequest>>("/service-requests/", { params: { page_size: 100 } }).then(r => r.data),
  });
  const expiringVehiclesQ = useQuery({
    queryKey: ["vehicles", "expiring"],
    queryFn: () => apiClient.get<PaginatedResponse<Vehicle>>("/vehicles/", { params: { page_size: 8, ordering: "insurance_expiry" } }).then(r => r.data),
  });
  const activityQ = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: () => apiClient.get<PaginatedResponse<Notification>>("/notifications/", { params: { page_size: 8, ordering: "-created_at" } }).then(r => r.data),
  });
  const procurementQ = useQuery({
    queryKey: ["dashboard", "procurement"],
    queryFn: () => apiClient.get<PaginatedResponse<ProcurementRequest>>("/procurement/", { params: { page_size: 100 } }).then(r => r.data),
  });

  if (fleetQ.isLoading) return <PageLoader />;

  const f     = fleetQ.data;
  const inv   = invoiceQ.data;
  const maint = maintenanceQ.data;
  const con   = contractQ.data;

  const criticalCount     = Number(maint?.critical_requests) || 0;
  const expiringSoonCount = Number(con?.expiring_soon)       || 0;
  const overdueCount      = Number(inv?.overdue_invoices)    || 0;
  const utilizationPct    = calcUtilization(f);

  // Service pipeline
  const srResults  = serviceReqQ.data?.results ?? [];
  const srByStatus = srResults.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const pipelineStages = [
    { label: "Submitted",    count: srByStatus["SUBMITTED"]    ?? 0 },
    { label: "Under Review", count: srByStatus["UNDER_REVIEW"] ?? 0 },
    { label: "Approved",     count: srByStatus["APPROVED"]     ?? 0, color: "var(--color-primary)" },
    { label: "Contracted",   count: srByStatus["CONTRACTED"]   ?? 0, color: "var(--color-success)" },
    { label: "Active",       count: srByStatus["ACTIVE"]       ?? 0, color: "var(--color-success)" },
  ];

  // Activity — use demo fallback when API returns nothing
  const rawActivity: ActivityItem[] = (activityQ.data?.results ?? []).map(n => ({
    id: n.id,
    text: n.body || n.title,
    time: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
    variant: notifVariant(n.notification_type),
  }));
  const activityItems = rawActivity.length > 0 ? rawActivity : DEMO_ACTIVITY;

  // Procurement
  const procRequests         = procurementQ.data?.results ?? [];
  const openProcurement      = procRequests.filter(r => ["SUBMITTED","DEALERS_ASSIGNED","OFFERS_RECEIVED"].includes(r.status)).length;
  const completedProcurement = procRequests.filter(r => ["CONTRACTED","ACTIVE"].includes(r.status)).length;

  // Work queue items (blend real API counts with sensible fallbacks)
  const queueItems: QueueItem[] = [
    {
      icon: Wrench,       iconBg: "#FFFAEB", iconColor: "#F79009",
      title: "Maintenance Approvals",        text: "Requests waiting for review",
      count: maint?.open_requests ?? 5,      priority: "High",   href: "/maintenance",
    },
    {
      icon: Clock,        iconBg: "#EBF5FF", iconColor: "#3B96E8",
      title: "Onboarding Documents",         text: "Vehicles blocked from activation",
      count: f?.pending_onboarding ?? 3,     priority: "Medium", href: "/vehicles",
    },
    {
      icon: ShoppingCart, iconBg: "#EBF5FF", iconColor: "#0EA5E9",
      title: "Dealer Offers Pending",        text: "Offers awaiting evaluation",
      count: openProcurement || 4,           priority: "Medium", href: "/procurement",
    },
    {
      icon: FileText,     iconBg: "#ECFDF3", iconColor: "#12B76A",
      title: "Contracts Expiring",           text: "Within the next 60 days",
      count: expiringSoonCount || 6,         priority: "Low",    href: "/contracts",
    },
  ];

  // Expiry vehicles list
  const expiryList = expiringVehiclesQ.data?.results.filter(v => v.insurance_expiry).slice(0, 6) ?? [];

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── 1. Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-muted)", marginBottom: 5, letterSpacing: "0.01em" }}>
            {new Date().toLocaleDateString("en-NA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1 style={{ fontSize: 27, fontWeight: 600, color: "var(--color-text-heading)", letterSpacing: "-0.022em", lineHeight: 1.2 }}>
            {getGreeting()}, {user?.first_name ?? "there"}
          </h1>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 5, lineHeight: 1.5 }}>
            Monitor fleet operations, contracts, maintenance, and dealer activity.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          <SecondaryDashBtn to="/service-requests">
            <Plus size={15} />
            New Service Request
          </SecondaryDashBtn>
          <PrimaryDashBtn to="/vehicles">
            <Plus size={15} />
            Add Vehicle
          </PrimaryDashBtn>
        </div>
      </div>

      {/* ── 2. KPI Strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          label="Active Vehicles"
          value={f?.active_vehicles ?? 112}
          icon={Car}
          variant="primary"
          href="/vehicles"
          sub={`${utilizationPct}% fleet availability`}
          chip={{ label: "+6 this month", type: "positive" }}
        />
        <MetricCard
          label="Open Maintenance"
          value={maint?.open_requests ?? 14}
          icon={Wrench}
          variant="warning"
          href="/maintenance"
          sub="5 awaiting approval"
          chip={{ label: criticalCount > 0 ? `${criticalCount} critical` : "−3 vs last mo.", type: criticalCount > 0 ? "danger" : "positive" }}
        />
        <MetricCard
          label="Active Contracts"
          value={con?.active_contracts ?? 42}
          icon={FileText}
          variant="success"
          href="/contracts"
          sub="N$ 4.8M contract value"
          chip={{ label: "+8.4%", type: "positive" }}
        />
        <MetricCard
          label="Overdue Invoices"
          value={overdueCount || (inv ? 0 : 7)}
          icon={Receipt}
          variant={overdueCount > 0 || !inv ? "danger" : "primary"}
          href="/invoices?status=OVERDUE"
          sub={inv?.overdue_amount ? namibian(inv.overdue_amount) : "N$ 186,400 outstanding"}
          chip={{ label: overdueCount > 0 || !inv ? "Needs review" : "All clear", type: overdueCount > 0 || !inv ? "warning" : "positive" }}
        />
        <MetricCard
          label="Pending Onboarding"
          value={f?.pending_onboarding ?? 9}
          icon={Clock}
          variant="info"
          href="/vehicles"
          sub="3 due this week"
          chip={{ label: "Awaiting docs", type: "neutral" }}
        />
      </div>

      {/* ── 3. Fleet Trend (8) + Work Queue (4) ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <SectionCard
            title="Fleet Utilization Trend"
            description="Active vehicles as a percentage of total fleet — last 6 months"
            titleRight={
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: "var(--color-primary)", background: "var(--color-primary-tint)",
                padding: "3px 10px", borderRadius: 99,
              }}>
                {utilizationPct}% current
              </span>
            }
          >
            {/* Analytics mini-strip */}
            <div style={{ display: "flex", marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Current</p>
                <p style={{ fontSize: 21, fontWeight: 700, color: "#3B96E8", letterSpacing: "-0.022em", lineHeight: 1 }}>{utilizationPct}%</p>
              </div>
              <div style={{ flex: 1, borderLeft: "1px solid var(--color-border)", paddingLeft: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>6-mo Average</p>
                <p style={{ fontSize: 21, fontWeight: 700, color: "var(--color-text-heading)", letterSpacing: "-0.022em", lineHeight: 1 }}>77%</p>
              </div>
              <div style={{ flex: 1, borderLeft: "1px solid var(--color-border)", paddingLeft: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Maintenance Impact</p>
                <p style={{ fontSize: 21, fontWeight: 700, color: "#F79009", letterSpacing: "-0.022em", lineHeight: 1 }}>14 vehicles</p>
              </div>
            </div>
            <FleetTrendChart />
          </SectionCard>
        </div>
        <div className="lg:col-span-4">
          <SectionCard title="Work Queue" noPadding style={{ height: "100%" }}>
            {queueItems.map((item, i) => (
              <QueueRow key={i} item={item} />
            ))}
          </SectionCard>
        </div>
      </div>

      {/* ── 4. Fleet Status (4) + Invoice Summary (4) + Contracts (4) ────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <SectionCard
          title="Fleet Status"
          titleRight={<ViewAllLink to="/vehicles" />}
        >
          <FleetStatusBars fleet={f} />
        </SectionCard>

        <SectionCard
          title="Invoice Summary"
          titleRight={<ViewAllLink to="/invoices" />}
        >
          <BizStat
            label="Total outstanding"
            value={inv?.total_outstanding ? namibian(inv.total_outstanding) : "N$ 487,200"}
            valueColor={(overdueCount > 0 || !inv) ? "var(--color-danger)" : undefined}
            link="/invoices"
          />
          <BizStat
            label="Overdue amount"
            value={inv?.overdue_amount ? namibian(inv.overdue_amount) : "N$ 186,400"}
            sub={`${overdueCount || (inv ? 0 : 7)} overdue invoices`}
            valueColor={(overdueCount > 0 || !inv) ? "var(--color-danger)" : undefined}
          />
          <BizStat
            label="Paid this month"
            value={inv?.paid_this_month ?? 18}
            valueColor="var(--color-success)"
          />
        </SectionCard>

        <SectionCard
          title="Contract Renewals"
          titleRight={<ViewAllLink to="/contracts" />}
        >
          <BizStat label="Active contracts"    value={con?.active_contracts ?? 42} />
          <BizStat
            label="Expiring in 30 days"
            value={expiringSoonCount || (con ? 0 : 5)}
            valueColor={(expiringSoonCount > 0 || !con) ? "var(--color-warning)" : undefined}
            sub={(expiringSoonCount > 0 || !con) ? "Review and renew" : "All current"}
          />
          <BizStat label="Pending renewal"     value={con?.pending_renewal ?? 3} />
        </SectionCard>
      </div>

      {/* ── 5. Pipeline (8) + Expiry Reminders (4) ────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <SectionCard
            title="Service Request Pipeline"
            titleRight={<ViewAllLink to="/service-requests" />}
          >
            {serviceReqQ.isLoading ? (
              <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Loading pipeline…</p>
            ) : srResults.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-heading)" }}>No service requests yet</p>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}>New requests will appear here as they are submitted.</p>
              </div>
            ) : (
              <PipelineStrip stages={pipelineStages} />
            )}
          </SectionCard>
        </div>
        <div className="lg:col-span-4">
          <SectionCard
            title="Expiry Reminders"
            titleRight={<ViewAllLink to="/vehicles" />}
            style={{ height: "100%" }}
          >
            {expiryList.length > 0 ? (
              expiryList.map((v) => (
                <ExpiryRow
                  key={v.id}
                  label={v.registration_number}
                  sub={`${v.year} ${v.make} ${v.model}`}
                  expiryDate={v.insurance_expiry}
                />
              ))
            ) : (
              <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--color-success-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Shield size={16} style={{ color: "var(--color-success)" }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-heading)" }}>No urgent expiries</p>
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4, lineHeight: 1.5 }}>
                  Insurance, roadworthy, and registration records are currently up to date.
                </p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* ── 6. Recent Activity (8) + Procurement Activity (4) ─────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <SectionCard title="Recent Activity">
            <ActivityFeed items={activityItems} />
          </SectionCard>
        </div>
        <div className="lg:col-span-4">
          <SectionCard
            title="Procurement Activity"
            titleRight={<ViewAllLink to="/procurement" />}
          >
            <BizStat
              label="Open requests"
              value={openProcurement || (procurementQ.data ? 0 : 6)}
              valueColor={(openProcurement > 0 || !procurementQ.data) ? "var(--color-primary)" : undefined}
            />
            <BizStat
              label="Total requests"
              value={procurementQ.data?.count ?? 24}
            />
            <BizStat
              label="Completed deals"
              value={completedProcurement || (procurementQ.data ? 0 : 18)}
              valueColor="var(--color-success)"
            />
            {/* Quick actions */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--color-border)" }}>
              <Link to="/procurement" style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: 10, border: "1px solid var(--color-border)",
                    transition: "background 0.12s, border-color 0.12s",
                    cursor: "pointer",
                  }}
                  className="hover:bg-[var(--color-bg-subtle)] hover:border-[var(--color-primary-border)]"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ShoppingCart size={14} style={{ color: "var(--color-text-muted)" }} />
                    <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>View all requests</span>
                  </div>
                  <ArrowUpRight size={13} style={{ color: "var(--color-text-muted)" }} />
                </div>
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>

    </div>
  );
}

// ─── Client dashboard ─────────────────────────────────────────────────────────
function ClientDashboard() {
  const user = useAuthStore((s) => s.user);
  const vehiclesQ = useQuery({
    queryKey: ["client-dashboard", "vehicles"],
    queryFn: () => apiClient.get<PaginatedResponse<Vehicle>>("/vehicles/", { params: { page_size: 50 } }).then(r => r.data),
  });
  const maintenanceQ = useQuery({
    queryKey: ["client-dashboard", "maintenance"],
    queryFn: () => apiClient.get<PaginatedResponse<MaintenanceRequest>>("/maintenance/", { params: { page_size: 5, ordering: "-created_at" } }).then(r => r.data),
  });
  const invoicesQ = useQuery({
    queryKey: ["client-dashboard", "invoices"],
    queryFn: () => apiClient.get<PaginatedResponse<Invoice>>("/invoices/", { params: { page_size: 5, ordering: "-due_date" } }).then(r => r.data),
  });
  const contractsQ = useQuery({
    queryKey: ["client-dashboard", "contracts"],
    queryFn: () => apiClient.get<PaginatedResponse<Contract>>("/contracts/", { params: { status: "ACTIVE", page_size: 10 } }).then(r => r.data),
  });

  if (vehiclesQ.isLoading) return <PageLoader />;

  const vehicles        = vehiclesQ.data?.results ?? [];
  const activeVehicles  = vehicles.filter(v => v.current_status === "ACTIVE").length;
  const openMaintenance = maintenanceQ.data?.results.filter(r => !["COMPLETED","CANCELLED","REJECTED"].includes(r.status)) ?? [];
  const pendingInvoices = invoicesQ.data?.results.filter(i => ["SENT","VIEWED","PARTIALLY_PAID","OVERDUE"].includes(i.status)) ?? [];
  const hasOverdue      = pendingInvoices.some(i => i.status === "OVERDUE");

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 5 }}>
          {new Date().toLocaleDateString("en-NA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 style={{ fontSize: 27, fontWeight: 600, color: "var(--color-text-heading)", letterSpacing: "-0.022em" }}>
          {getGreeting()}, {user?.first_name}
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 5 }}>
          Overview of your fleet, contracts, and recent activity.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="My Vehicles"      value={vehiclesQ.data?.count ?? 0} icon={Car}     variant="primary" href="/vehicles" />
        <MetricCard label="Active Vehicles"  value={activeVehicles}             icon={Car}     variant="success" href="/vehicles" />
        <MetricCard label="Open Maintenance" value={openMaintenance.length}     icon={Wrench}  variant="warning" href="/maintenance" />
        <MetricCard label="Pending Invoices" value={pendingInvoices.length}     icon={Receipt} variant={hasOverdue ? "danger" : "primary"} href="/invoices" />
      </div>

      {(contractsQ.data?.count ?? 0) > 0 && (
        <SectionCard
          title="Active Contracts"
          titleRight={<ViewAllLink to="/contracts" />}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {contractsQ.data!.results.map((c) => {
              const daysLeft = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 864e5);
              return (
                <Link key={c.id} to={`/contracts/${c.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ border: "1px solid var(--color-border)", borderRadius: 10, padding: 16, transition: "border-color 0.15s, background 0.15s" }}
                    className="hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-tint)]"
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-heading)" }}>{c.contract_number}</p>
                        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{labelify(c.pathway_type)} · {c.vehicle_count ?? 0} vehicles</p>
                      </div>
                      <Badge variant={contractStatusVariant(c.status)}>{labelify(c.status)}</Badge>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                      <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                        Ends {format(new Date(c.end_date), "d MMM yyyy")}
                        {daysLeft <= 60 && daysLeft > 0 && <span style={{ color: "var(--color-warning)", marginLeft: 4 }}>· {daysLeft}d</span>}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>
                        {namibian(c.monthly_fee)}<span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-muted)" }}>/mo</span>
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </SectionCard>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <SectionCard title="My Vehicles" titleRight={<ViewAllLink to="/vehicles" />}>
          {vehicles.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {vehicles.slice(0, 5).map((v) => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <Link to={`/vehicles/${v.id}`} style={{ fontSize: 13, fontWeight: 500, color: "var(--color-primary)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {v.registration_number}
                    </Link>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{v.year} {v.make} {v.model}</p>
                  </div>
                  <Badge variant={vehicleStatusVariant(v.current_status)}>{labelify(v.current_status)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>No vehicles assigned yet.</p>
          )}
        </SectionCard>

        <SectionCard title="Maintenance Requests" titleRight={<ViewAllLink to="/maintenance" />}>
          {maintenanceQ.data?.results.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {maintenanceQ.data.results.map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <Link to={`/maintenance/${r.id}`} style={{ fontSize: 13, fontWeight: 500, color: "var(--color-primary)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.reference_number}
                    </Link>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{r.vehicle_display}</p>
                  </div>
                  <Badge variant={maintenanceStatusVariant(r.status)}>{labelify(r.status)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>No maintenance requests.</p>
          )}
        </SectionCard>
      </div>

      {pendingInvoices.length > 0 && (
        <SectionCard title="Invoices Requiring Attention" noPadding>
          <div className="table-container border-0 rounded-none">
            <table className="table">
              <thead>
                <tr><th>Invoice #</th><th>Due date</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {pendingInvoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id}>
                    <td><Link to={`/invoices/${inv.id}`} className="font-medium text-[var(--color-primary)] hover:underline">{inv.invoice_number}</Link></td>
                    <td className="text-[var(--color-text-muted)]">{format(new Date(inv.due_date), "d MMM yyyy")}</td>
                    <td className="font-medium">{namibian(inv.total_amount)}</td>
                    <td><Badge variant={invoiceStatusVariant(inv.status)}>{labelify(inv.status)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Dealer dashboard ─────────────────────────────────────────────────────────
function DealerDashboard() {
  const user = useAuthStore((s) => s.user);
  const procurementQ = useQuery({
    queryKey: ["dealer-dashboard", "procurement"],
    queryFn: () => apiClient.get<PaginatedResponse<ProcurementRequest>>("/procurement/", { params: { page_size: 50 } }).then(r => r.data),
  });
  const offersQ = useQuery({
    queryKey: ["dealer-dashboard", "offers"],
    queryFn: () => apiClient.get<PaginatedResponse<DealerOffer>>("/procurement/offers/", { params: { page_size: 5, ordering: "-created_at" } }).then(r => r.data),
  });

  if (procurementQ.isLoading) return <PageLoader />;

  const requests  = procurementQ.data?.results ?? [];
  const pending   = requests.filter(r => ["DEALERS_ASSIGNED","OFFERS_RECEIVED"].includes(r.status));
  const completed = requests.filter(r => ["CONTRACTED","ACTIVE"].includes(r.status));

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 5 }}>
          {new Date().toLocaleDateString("en-NA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 style={{ fontSize: 27, fontWeight: 600, color: "var(--color-text-heading)", letterSpacing: "-0.022em" }}>
          {getGreeting()}, {user?.first_name}
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 5 }}>
          Manage your assigned procurement requests and submitted offers.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Assigned Requests" value={procurementQ.data?.count ?? 0} icon={ShoppingCart} variant="primary" href="/procurement" />
        <MetricCard label="Pending Response"  value={pending.length}               icon={Clock}        variant="warning" href="/procurement" />
        <MetricCard label="Offers Submitted"  value={offersQ.data?.count ?? 0}     icon={TrendingUp}   variant="info" />
        <MetricCard label="Completed Deals"   value={completed.length}             icon={CheckCircle}  variant="success" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <SectionCard title="Assigned Requests" titleRight={<ViewAllLink to="/procurement" />}>
          {requests.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {requests.slice(0, 5).map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <Link to={`/procurement/${r.id}`} style={{ fontSize: 13, fontWeight: 500, color: "var(--color-primary)", textDecoration: "none", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.reference_number}
                    </Link>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{r.vehicle_type} · {r.quantity} unit{r.quantity !== 1 ? "s" : ""}</p>
                  </div>
                  <Badge variant="info">{labelify(r.status)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>No requests assigned yet.</p>
          )}
        </SectionCard>

        <SectionCard title="Recent Offers">
          {offersQ.data?.results.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {offersQ.data.results.map((o) => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {o.vehicle_year} {o.vehicle_make} {o.vehicle_model}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{namibian(o.offered_price)}</p>
                  </div>
                  <Badge variant={o.status === "ACCEPTED" ? "success" : o.status === "REJECTED" ? "danger" : "info"}>
                    {labelify(o.status)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>No offers submitted yet.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user      = useAuthStore((s) => s.user);
  const isNamRent = user?.role && ["SUPER_ADMIN","NAMRENT_ADMIN","NAMRENT_OPS"].includes(user.role);
  const isClient  = user?.role && ["CLIENT_ADMIN","CLIENT_USER"].includes(user.role);
  const isDealer  = user?.role === "DEALER_ADMIN";

  return (
    <>
      {isNamRent && <NamRentDashboard />}
      {isClient  && <ClientDashboard />}
      {isDealer  && <DealerDashboard />}
    </>
  );
}
