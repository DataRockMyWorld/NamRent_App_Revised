import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, ClipboardList } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { ServiceRequest, PaginatedResponse } from "@/types";
import {
  Button, Badge, ListPageSkeleton, EmptyState, FilterBar,
  InlineStatStrip, RowActions,
} from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { format } from "date-fns";

const PAGE_SIZE = 20;

function labelify(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function srStatusVariant(status: string) {
  if (["ACTIVE", "CONTRACTED"].includes(status)) return "success" as const;
  if (["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(status)) return "info" as const;
  if (status === "REJECTED") return "danger" as const;
  return "default" as const;
}

export default function ServiceRequestListPage() {
  const user = useAuthStore((s) => s.user);
  const isClient = user?.role && ["CLIENT_ADMIN", "CLIENT_USER"].includes(user.role);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["service-requests", page, search],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<ServiceRequest>>("/service-requests/", {
          params: { page, search, page_size: PAGE_SIZE },
        })
        .then((r) => r.data),
  });

  const activeQ = useQuery({
    queryKey: ["sr-stat", "active"],
    queryFn: () => apiClient.get<PaginatedResponse<ServiceRequest>>("/service-requests/", { params: { status: "ACTIVE", page_size: 1 } }).then(r => r.data.count),
  });
  const submittedQ = useQuery({
    queryKey: ["sr-stat", "submitted"],
    queryFn: () => apiClient.get<PaginatedResponse<ServiceRequest>>("/service-requests/", { params: { status: "SUBMITTED", page_size: 1 } }).then(r => r.data.count),
  });

  if (isLoading) return <ListPageSkeleton columns={7} stats={3} />;
  const requests = data?.results ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  return (
    <div className="page-container">
      <PageHeader
        title="Service Requests"
        subtitle={`${data?.count ?? 0} requests`}
        action={isClient ? (
          <Link to="/service-requests/new"><Button><Plus size={16} /> New request</Button></Link>
        ) : undefined}
        filters={
          <FilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search service requests…"
          />
        }
      />

      <InlineStatStrip stats={[
        { label: "Total", value: data?.count ?? 0 },
        { label: "Submitted", value: submittedQ.data ?? 0, variant: "primary" },
        { label: "Active", value: activeQ.data ?? 0, variant: "success" },
      ]} />

      {requests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No service requests" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Client</th>
                <th>Duration</th>
                <th>Vehicles</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/service-requests/${r.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                      {r.reference_number}
                    </Link>
                  </td>
                  <td>{r.client_name}</td>
                  <td>{r.duration_years} {r.duration_years === 1 ? "year" : "years"}</td>
                  <td>{r.vehicle_count ?? 0}</td>
                  <td><Badge variant={srStatusVariant(r.status)}>{labelify(r.status)}</Badge></td>
                  <td>{format(new Date(r.created_at), "d MMM yyyy")}</td>
                  <td className="w-10">
                    <RowActions actions={[
                      { label: "View", to: `/service-requests/${r.id}` },
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
