import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Wrench } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { MaintenanceRequest, PaginatedResponse } from "@/types";
import {
  Button, Badge,
  maintenanceStatusVariant, priorityVariant,
  ListPageSkeleton, EmptyState, FilterBar, FilterSelect,
  InlineStatStrip, RowActions,
} from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { format } from "date-fns";

const PAGE_SIZE = 20;

function labelify(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "APPROVED", label: "Approved" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export default function MaintenanceListPage() {
  const user = useAuthStore((s) => s.user);
  const isClient = user?.role && ["CLIENT_ADMIN", "CLIENT_USER"].includes(user.role);
  const isNamRent = user?.role && ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"].includes(user.role);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance", page, search, status, priority],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<MaintenanceRequest>>("/maintenance/", {
          params: {
            page, search,
            status: status || undefined,
            priority: priority || undefined,
            page_size: PAGE_SIZE,
          },
        })
        .then((r) => r.data),
  });

  const criticalQ = useQuery({
    queryKey: ["maintenance-stat", "critical"],
    queryFn: () => apiClient.get<PaginatedResponse<MaintenanceRequest>>("/maintenance/", { params: { priority: "CRITICAL", page_size: 1 } }).then(r => r.data.count),
  });
  const openQ = useQuery({
    queryKey: ["maintenance-stat", "open"],
    queryFn: () => apiClient.get<PaginatedResponse<MaintenanceRequest>>("/maintenance/", { params: { status: "IN_PROGRESS", page_size: 1 } }).then(r => r.data.count),
  });
  const completedQ = useQuery({
    queryKey: ["maintenance-stat", "completed"],
    queryFn: () => apiClient.get<PaginatedResponse<MaintenanceRequest>>("/maintenance/", { params: { status: "COMPLETED", page_size: 1 } }).then(r => r.data.count),
  });

  if (isLoading) return <ListPageSkeleton columns={8} stats={4} />;
  const requests = data?.results ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);
  const hasFilters = !!(search || status || priority);

  return (
    <div className="page-container">
      <PageHeader
        title="Maintenance"
        subtitle={`${data?.count ?? 0} requests`}
        action={isClient ? (
          <Link to="/maintenance/new"><Button><Plus size={16} /> New request</Button></Link>
        ) : undefined}
        filters={
          <FilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search reference, vehicle…"
            hasActiveFilters={hasFilters}
            onClearFilters={() => { setSearch(""); setStatus(""); setPriority(""); setPage(1); }}
            filters={
              <>
                <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </FilterSelect>
                <FilterSelect value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
                  {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </FilterSelect>
              </>
            }
          />
        }
      />

      <InlineStatStrip stats={[
        { label: "Total", value: data?.count ?? 0 },
        { label: "Critical", value: criticalQ.data ?? 0, variant: "danger" },
        { label: "In progress", value: openQ.data ?? 0, variant: "warning" },
        { label: "Completed", value: completedQ.data ?? 0, variant: "success" },
      ]} />

      {requests.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance requests"
          description={search || status ? "Try adjusting your filters." : "No requests have been submitted yet."}
          action={isClient ? (
            <Link to="/maintenance/new"><Button><Plus size={16} /> Submit a request</Button></Link>
          ) : undefined}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Client</th>
                <th>Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/maintenance/${r.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                      {r.reference_number}
                    </Link>
                  </td>
                  <td>{r.vehicle_display}</td>
                  <td>{labelify(r.request_type)}</td>
                  <td><Badge variant={priorityVariant(r.priority)}>{labelify(r.priority)}</Badge></td>
                  <td><Badge variant={maintenanceStatusVariant(r.status)}>{labelify(r.status)}</Badge></td>
                  <td>{r.client_name}</td>
                  <td>{format(new Date(r.created_at), "d MMM yyyy")}</td>
                  <td className="w-10">
                    <RowActions actions={[
                      { label: "View", to: `/maintenance/${r.id}` },
                      ...(isNamRent ? [{ label: "Edit", to: `/maintenance/${r.id}/edit` }] : []),
                    ]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
          <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data?.count ?? 0)} of {data?.count ?? 0}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Previous</Button>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
