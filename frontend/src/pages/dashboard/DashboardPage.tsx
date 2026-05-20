import { useQuery } from "@tanstack/react-query";
import {
  Car, FileText, Wrench, Receipt, AlertCircle, Clock, CheckCircle,
  ShoppingCart, Shield, TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import { labelify, namibian } from "@/utils/format";
import type {
  Vehicle, MaintenanceRequest, Invoice, Contract,
  PaginatedResponse, DealerOffer, ProcurementRequest, Notification, ServiceRequest,
} from "@/types";
import {
  MetricCard, SectionCard, WorkQueueItem, ExpiryRow,
  Badge, vehicleStatusVariant, maintenanceStatusVariant,
  invoiceStatusVariant, contractStatusVariant,
  PageLoader, StatRow, PipelineStrip, ActivityFeed, Button,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Business stat row ────────────────────────────────────────────────────────
function BizStat({ label, value, sub, valueColor }: {
  label: string; value: string | number; sub?: string; valueColor?: string;
}) {
  return (
    <div className="py-3 border-b border-[var(--color-border)] last:border-b-0">
      <p className="text-xs text-[var(--color-text-muted)] mb-0.5">{label}</p>
      <p className="text-lg font-bold" style={{ color: valueColor ?? "var(--color-text-heading)" }}>
        {value}
      </p>
      {sub && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── NamRent / Ops dashboard ─────────────────────────────────────────────────
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
    queryFn: () => apiClient.get<PaginatedResponse<Vehicle>>("/vehicles/", { params: { page_size: 10, ordering: "insurance_expiry" } }).then(r => r.data),
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

  const f = fleetQ.data;
  const inv = invoiceQ.data;
  const maint = maintenanceQ.data;
  const con = contractQ.data;

  const criticalCount = maint?.critical_requests ?? 0;
  const expiringSoonCount = con?.expiring_soon ?? 0;
  const overdueCount = inv?.overdue_invoices ?? 0;

  // Service pipeline stage counts
  const srResults = serviceReqQ.data?.results ?? [];
  const srByStatus = srResults.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pipelineStages = [
    { label: "Submitted", count: srByStatus["SUBMITTED"] ?? 0 },
    { label: "Under Review", count: srByStatus["UNDER_REVIEW"] ?? 0 },
    { label: "Approved", count: srByStatus["APPROVED"] ?? 0, color: "var(--color-primary)" },
    { label: "Contracted", count: srByStatus["CONTRACTED"] ?? 0, color: "var(--color-success)" },
    { label: "Active", count: srByStatus["ACTIVE"] ?? 0, color: "var(--color-success)" },
  ];

  // Activity feed
  const activityItems: ActivityItem[] = (activityQ.data?.results ?? []).map(n => ({
    id: n.id,
    text: n.body || n.title,
    time: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
    variant: notifVariant(n.notification_type),
  }));

  // Procurement summary
  const procRequests = procurementQ.data?.results ?? [];
  const openProcurement = procRequests.filter(r => ["SUBMITTED", "DEALERS_ASSIGNED", "OFFERS_RECEIVED"].includes(r.status)).length;
  const completedProcurement = procRequests.filter(r => ["CONTRACTED", "ACTIVE"].includes(r.status)).length;

  return (
    <div className="page-container space-y-6">
      {/* ── Dashboard Header ── */}
      <div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
          {new Date().toLocaleDateString("en-NA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-title">{getGreeting()}, {user?.first_name}</h1>
            <p className="page-subtitle">Monitor fleet operations, contracts, maintenance, and dealer activity.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/service-requests">
              <Button variant="secondary" size="sm">+ Service Request</Button>
            </Link>
            <Link to="/vehicles">
              <Button size="sm">+ Vehicle</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard
          label="Active Vehicles"
          value={f?.active_vehicles ?? 0}
          icon={Car}
          variant="primary"
          href="/vehicles"
          sub={f ? `${f.total_vehicles} total` : undefined}
        />
        <MetricCard
          label="Open Maintenance"
          value={maint?.open_requests ?? 0}
          icon={Wrench}
          variant="warning"
          href="/maintenance"
          sub={criticalCount > 0 ? `${criticalCount} critical` : undefined}
        />
        <MetricCard
          label="Active Contracts"
          value={con?.active_contracts ?? 0}
          icon={FileText}
          variant="success"
          href="/contracts"
          sub={expiringSoonCount > 0 ? `${expiringSoonCount} expiring` : undefined}
        />
        <MetricCard
          label="Overdue Invoices"
          value={overdueCount}
          icon={Receipt}
          variant={overdueCount > 0 ? "danger" : "primary"}
          href="/invoices?status=OVERDUE"
          sub={inv ? namibian(inv.overdue_amount) : undefined}
        />
        <MetricCard
          label="Pending Onboarding"
          value={f?.pending_onboarding ?? 0}
          icon={Clock}
          variant="info"
          href="/vehicles"
        />
      </div>

      {/* ── Main 2-column layout ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-5">

          {/* Fleet Status Overview */}
          <SectionCard
            title="Fleet Overview"
            titleRight={
              <Link to="/vehicles" className="text-xs text-[var(--color-primary)] hover:underline">
                View all
              </Link>
            }
          >
            {f ? (
              <>
                <StatRow label="Active" count={f.active_vehicles} total={f.total_vehicles} color="var(--color-success)" />
                <StatRow label="Under Maintenance" count={f.under_maintenance} total={f.total_vehicles} color="var(--color-warning)" />
                <StatRow label="Pending Onboarding" count={f.pending_onboarding} total={f.total_vehicles} color="var(--color-primary)" />
                <StatRow label="Out of Service" count={f.out_of_service} total={f.total_vehicles} color="var(--color-danger)" />
              </>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Loading fleet data…</p>
            )}
          </SectionCard>

          {/* Service Pipeline */}
          <SectionCard
            title="Service Request Pipeline"
            titleRight={
              <Link to="/service-requests" className="text-xs text-[var(--color-primary)] hover:underline">
                View all
              </Link>
            }
          >
            {serviceReqQ.isLoading ? (
              <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>
            ) : srResults.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No service requests yet.</p>
            ) : (
              <PipelineStrip stages={pipelineStages} />
            )}
          </SectionCard>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-5">

          {/* Work Queue */}
          <SectionCard title="Work Queue" noPadding>
            {criticalCount > 0 && (
              <WorkQueueItem icon={AlertCircle} label="Critical Maintenance" count={criticalCount} href="/maintenance?priority=CRITICAL" variant="critical" />
            )}
            {overdueCount > 0 && (
              <WorkQueueItem icon={Receipt} label="Overdue Invoices" count={overdueCount} href="/invoices?status=OVERDUE" variant="critical" />
            )}
            {expiringSoonCount > 0 && (
              <WorkQueueItem icon={FileText} label="Contracts Expiring Soon" count={expiringSoonCount} href="/contracts?expiring=true" variant="warning" />
            )}
            {(maint?.open_requests ?? 0) > 0 && (
              <WorkQueueItem icon={Wrench} label="Open Maintenance Requests" count={maint!.open_requests} href="/maintenance" variant="info" />
            )}
            {(f?.pending_onboarding ?? 0) > 0 && (
              <WorkQueueItem icon={Clock} label="Vehicles Pending Onboarding" count={f!.pending_onboarding} href="/vehicles" variant="default" />
            )}
            {criticalCount === 0 && overdueCount === 0 && expiringSoonCount === 0 && (maint?.open_requests ?? 0) === 0 && (
              <div className="px-5 py-8 flex flex-col items-center text-center">
                <div className="h-9 w-9 rounded-full bg-[var(--color-success-tint)] flex items-center justify-center mb-2.5">
                  <CheckCircle size={16} className="text-[var(--color-success)]" />
                </div>
                <p className="text-sm font-medium text-[var(--color-text-heading)]">All caught up</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">No urgent items right now.</p>
              </div>
            )}
          </SectionCard>

          {/* Expiry Reminders */}
          <SectionCard
            title="Expiry Reminders"
            titleRight={
              <Link to="/vehicles" className="text-xs text-[var(--color-primary)] hover:underline">
                View all
              </Link>
            }
          >
            {expiringVehiclesQ.data?.results.filter(v => v.insurance_expiry).slice(0, 6).map((v) => (
              <ExpiryRow
                key={v.id}
                label={v.registration_number}
                sub={`${v.year} ${v.make} ${v.model}`}
                expiryDate={v.insurance_expiry}
              />
            ))}
            {!expiringVehiclesQ.data?.results.some(v => v.insurance_expiry) && (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="h-9 w-9 rounded-full bg-[var(--color-success-tint)] flex items-center justify-center mb-2.5">
                  <Shield size={16} className="text-[var(--color-success)]" />
                </div>
                <p className="text-sm font-medium text-[var(--color-text-heading)]">No upcoming expirations</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">All vehicles are up to date.</p>
              </div>
            )}
          </SectionCard>

          {/* Activity Feed */}
          <SectionCard title="Recent Activity">
            <ActivityFeed items={activityItems} />
          </SectionCard>
        </div>
      </div>

      {/* ── Business Overview ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <SectionCard title="Invoices">
          <BizStat
            label="Total outstanding"
            value={inv ? namibian(inv.total_outstanding) : "—"}
            valueColor={overdueCount > 0 ? "var(--color-danger)" : undefined}
          />
          <BizStat
            label="Overdue invoices"
            value={overdueCount}
            sub={inv ? `${namibian(inv.overdue_amount)} overdue` : undefined}
            valueColor={overdueCount > 0 ? "var(--color-danger)" : undefined}
          />
          <BizStat
            label="Paid this month"
            value={inv?.paid_this_month ?? 0}
            valueColor="var(--color-success)"
          />
        </SectionCard>

        <SectionCard title="Contracts">
          <BizStat label="Active contracts" value={con?.active_contracts ?? 0} />
          <BizStat
            label="Expiring in 30 days"
            value={expiringSoonCount}
            valueColor={expiringSoonCount > 0 ? "var(--color-warning)" : undefined}
          />
          <BizStat label="Pending renewal" value={con?.pending_renewal ?? 0} />
        </SectionCard>

        <SectionCard title="Procurement">
          <BizStat
            label="Open requests"
            value={openProcurement}
            valueColor={openProcurement > 0 ? "var(--color-primary)" : undefined}
          />
          <BizStat label="Total requests" value={procurementQ.data?.count ?? 0} />
          <BizStat
            label="Completed deals"
            value={completedProcurement}
            valueColor="var(--color-success)"
          />
        </SectionCard>
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

  const vehicles = vehiclesQ.data?.results ?? [];
  const activeVehicles = vehicles.filter(v => v.current_status === "ACTIVE").length;
  const openMaintenance = maintenanceQ.data?.results.filter(r => !["COMPLETED", "CANCELLED", "REJECTED"].includes(r.status)) ?? [];
  const pendingInvoices = invoicesQ.data?.results.filter(i => ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"].includes(i.status)) ?? [];
  const hasOverdue = pendingInvoices.some(i => i.status === "OVERDUE");

  return (
    <div className="page-container space-y-6">
      <div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
          {new Date().toLocaleDateString("en-NA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="page-title">{getGreeting()}, {user?.first_name}</h1>
        <p className="page-subtitle">Overview of your fleet, contracts, and recent activity.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="My Vehicles" value={vehiclesQ.data?.count ?? 0} icon={Car} variant="primary" href="/vehicles" />
        <MetricCard label="Active Vehicles" value={activeVehicles} icon={Car} variant="success" href="/vehicles" />
        <MetricCard label="Open Maintenance" value={openMaintenance.length} icon={Wrench} variant="warning" href="/maintenance" />
        <MetricCard label="Pending Invoices" value={pendingInvoices.length} icon={Receipt} variant={hasOverdue ? "danger" : "primary"} href="/invoices" />
      </div>

      {/* Active contracts */}
      {(contractsQ.data?.count ?? 0) > 0 && (
        <SectionCard
          title="Active Contracts"
          titleRight={<Link to="/contracts" className="text-xs text-[var(--color-primary)] hover:underline">View all</Link>}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {contractsQ.data!.results.map((c) => {
              const daysLeft = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <Link key={c.id} to={`/contracts/${c.id}`}>
                  <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] p-4 hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-tint)] transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-heading)]">{c.contract_number}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{labelify(c.pathway_type)} · {c.vehicle_count ?? 0} vehicles</p>
                      </div>
                      <Badge variant={contractStatusVariant(c.status)}>{labelify(c.status)}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Ends {format(new Date(c.end_date), "d MMM yyyy")}
                        {daysLeft <= 60 && daysLeft > 0 && <span className="ml-1 text-[var(--color-warning)]">· {daysLeft}d left</span>}
                      </p>
                      <p className="text-sm font-bold text-[var(--color-primary)]">{namibian(c.monthly_fee)}<span className="text-xs font-normal text-[var(--color-text-muted)]">/mo</span></p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="My Vehicles"
          titleRight={<Link to="/vehicles" className="text-xs text-[var(--color-primary)] hover:underline">View all</Link>}
        >
          {vehicles.length ? (
            <div className="space-y-3">
              {vehicles.slice(0, 5).map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/vehicles/${v.id}`} className="text-sm font-medium text-[var(--color-primary)] hover:underline block truncate">
                      {v.registration_number}
                    </Link>
                    <p className="text-xs text-[var(--color-text-muted)]">{v.year} {v.make} {v.model}</p>
                  </div>
                  <Badge variant={vehicleStatusVariant(v.current_status)}>{labelify(v.current_status)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No vehicles assigned yet.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Maintenance Requests"
          titleRight={<Link to="/maintenance" className="text-xs text-[var(--color-primary)] hover:underline">View all</Link>}
        >
          {maintenanceQ.data?.results.length ? (
            <div className="space-y-3">
              {maintenanceQ.data.results.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/maintenance/${r.id}`} className="text-sm font-medium text-[var(--color-primary)] hover:underline truncate block">
                      {r.reference_number}
                    </Link>
                    <p className="text-xs text-[var(--color-text-muted)]">{r.vehicle_display}</p>
                  </div>
                  <Badge variant={maintenanceStatusVariant(r.status)}>{labelify(r.status)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No maintenance requests.</p>
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

  const requests = procurementQ.data?.results ?? [];
  const pending = requests.filter(r => ["DEALERS_ASSIGNED", "OFFERS_RECEIVED"].includes(r.status));
  const completed = requests.filter(r => ["CONTRACTED", "ACTIVE"].includes(r.status));

  return (
    <div className="page-container space-y-6">
      <div>
        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
          {new Date().toLocaleDateString("en-NA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="page-title">{getGreeting()}, {user?.first_name}</h1>
        <p className="page-subtitle">Manage your assigned procurement requests and submitted offers.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Assigned Requests" value={procurementQ.data?.count ?? 0} icon={ShoppingCart} variant="primary" href="/procurement" />
        <MetricCard label="Pending Response" value={pending.length} icon={Clock} variant="warning" href="/procurement" />
        <MetricCard label="Offers Submitted" value={offersQ.data?.count ?? 0} icon={TrendingUp} variant="info" />
        <MetricCard label="Completed Deals" value={completed.length} icon={CheckCircle} variant="success" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Assigned Procurement Requests"
          titleRight={<Link to="/procurement" className="text-xs text-[var(--color-primary)] hover:underline">View all</Link>}
        >
          {requests.length ? (
            <div className="space-y-3">
              {requests.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/procurement/${r.id}`} className="text-sm font-medium text-[var(--color-primary)] hover:underline block truncate">
                      {r.reference_number}
                    </Link>
                    <p className="text-xs text-[var(--color-text-muted)]">{r.vehicle_type} · {r.quantity} unit{r.quantity !== 1 ? "s" : ""}</p>
                  </div>
                  <Badge variant="info">{labelify(r.status)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No requests assigned yet.</p>
          )}
        </SectionCard>

        <SectionCard title="Recent Offers Submitted">
          {offersQ.data?.results.length ? (
            <div className="space-y-3">
              {offersQ.data.results.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {o.vehicle_year} {o.vehicle_make} {o.vehicle_model}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{namibian(o.offered_price)}</p>
                  </div>
                  <Badge variant={o.status === "ACCEPTED" ? "success" : o.status === "REJECTED" ? "danger" : "info"}>
                    {labelify(o.status)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No offers submitted yet.</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isNamRent = user?.role && ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"].includes(user.role);
  const isClient  = user?.role && ["CLIENT_ADMIN", "CLIENT_USER"].includes(user.role);
  const isDealer  = user?.role === "DEALER_ADMIN";

  return (
    <>
      {isNamRent && <NamRentDashboard />}
      {isClient  && <ClientDashboard />}
      {isDealer  && <DealerDashboard />}
    </>
  );
}
