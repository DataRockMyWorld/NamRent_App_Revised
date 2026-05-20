import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Car } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { Vehicle, PaginatedResponse } from "@/types";
import {
  Button, Badge, vehicleStatusVariant, ListPageSkeleton, EmptyState,
  FilterBar, InlineStatStrip, RowActions,
} from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { format } from "date-fns";

const PAGE_SIZE = 20;

function labelify(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function VehicleListPage() {
  const user = useAuthStore((s) => s.user);
  const isNamRent = user?.role && ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"].includes(user.role);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["vehicles", page, search],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Vehicle>>("/vehicles/", {
          params: { page, search, page_size: PAGE_SIZE },
        })
        .then((r) => r.data),
  });

  const activeQ = useQuery({
    queryKey: ["vehicles-stat", "active"],
    queryFn: () => apiClient.get<PaginatedResponse<Vehicle>>("/vehicles/", { params: { current_status: "ACTIVE", page_size: 1 } }).then(r => r.data.count),
  });
  const maintQ = useQuery({
    queryKey: ["vehicles-stat", "maintenance"],
    queryFn: () => apiClient.get<PaginatedResponse<Vehicle>>("/vehicles/", { params: { current_status: "UNDER_MAINTENANCE", page_size: 1 } }).then(r => r.data.count),
  });
  const pendingQ = useQuery({
    queryKey: ["vehicles-stat", "pending"],
    queryFn: () => apiClient.get<PaginatedResponse<Vehicle>>("/vehicles/", { params: { current_status: "PENDING_ONBOARDING", page_size: 1 } }).then(r => r.data.count),
  });

  if (isLoading) return <ListPageSkeleton columns={8} stats={4} />;

  const vehicles = data?.results ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  return (
    <div className="page-container">
      <PageHeader
        title="Vehicles"
        subtitle={`${data?.count ?? 0} vehicles in fleet`}
        action={isNamRent ? (
          <Link to="/vehicles/new">
            <Button><Plus size={16} /> Add vehicle</Button>
          </Link>
        ) : undefined}
        filters={
          <FilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search by registration, make, model…"
          />
        }
      />

      <InlineStatStrip stats={[
        { label: "Total", value: data?.count ?? 0 },
        { label: "Active", value: activeQ.data ?? 0, variant: "success" },
        { label: "Maintenance", value: maintQ.data ?? 0, variant: "warning" },
        { label: "Pending onboarding", value: pendingQ.data ?? 0, variant: "primary" },
      ]} />

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles found"
          description={search ? "Try adjusting your search." : "No vehicles have been added yet."}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Registration</th>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Ownership</th>
                <th>Client</th>
                <th>Status</th>
                <th>Insurance expiry</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>
                    <Link
                      to={`/vehicles/${v.id}`}
                      className="font-medium text-[var(--color-primary)] hover:underline"
                    >
                      {v.registration_number}
                    </Link>
                  </td>
                  <td>{v.year} {v.make} {v.model}</td>
                  <td>{labelify(v.vehicle_type)}</td>
                  <td>{labelify(v.ownership_type)}</td>
                  <td>{v.client_name ?? <span className="text-[var(--color-text-muted)]">—</span>}</td>
                  <td>
                    <Badge variant={vehicleStatusVariant(v.current_status)}>
                      {labelify(v.current_status)}
                    </Badge>
                  </td>
                  <td>
                    {v.insurance_expiry
                      ? format(new Date(v.insurance_expiry), "d MMM yyyy")
                      : <span className="text-[var(--color-text-muted)]">—</span>}
                  </td>
                  <td className="w-10">
                    <RowActions actions={[
                      { label: "View", to: `/vehicles/${v.id}` },
                      ...(isNamRent ? [{ label: "Edit", to: `/vehicles/${v.id}/edit` }] : []),
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
