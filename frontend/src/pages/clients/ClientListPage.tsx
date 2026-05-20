import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Building2 } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import type { Client, PaginatedResponse } from "@/types";
import {
  Button, Badge, kycStatusVariant, ListPageSkeleton, EmptyState, FilterBar,
  InlineStatStrip, RowActions,
} from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";

const PAGE_SIZE = 20;

function labelify(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ClientListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["clients", page, search],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Client>>("/clients/", {
          params: { page, search, page_size: PAGE_SIZE },
        })
        .then((r) => r.data),
  });

  const activeQ = useQuery({
    queryKey: ["clients-stat", "active"],
    queryFn: () => apiClient.get<PaginatedResponse<Client>>("/clients/", { params: { account_status: "ACTIVE", page_size: 1 } }).then(r => r.data.count),
  });
  const pendingKycQ = useQuery({
    queryKey: ["clients-stat", "pending-kyc"],
    queryFn: () => apiClient.get<PaginatedResponse<Client>>("/clients/", { params: { kyc_status: "PENDING", page_size: 1 } }).then(r => r.data.count),
  });
  const suspendedQ = useQuery({
    queryKey: ["clients-stat", "suspended"],
    queryFn: () => apiClient.get<PaginatedResponse<Client>>("/clients/", { params: { account_status: "SUSPENDED", page_size: 1 } }).then(r => r.data.count),
  });

  if (isLoading) return <ListPageSkeleton columns={7} stats={4} />;
  const clients = data?.results ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  return (
    <div className="page-container">
      <PageHeader
        title="Clients"
        subtitle={`${data?.count ?? 0} clients`}
        action={<Link to="/clients/new"><Button><Plus size={16} /> Add client</Button></Link>}
        filters={
          <FilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search by name, email…"
          />
        }
      />

      <InlineStatStrip stats={[
        { label: "Total", value: data?.count ?? 0 },
        { label: "Active", value: activeQ.data ?? 0, variant: "success" },
        { label: "Pending KYC", value: pendingKycQ.data ?? 0, variant: "warning" },
        { label: "Suspended", value: suspendedQ.data ?? 0, variant: "danger" },
      ]} />

      {clients.length === 0 ? (
        <EmptyState icon={Building2} title="No clients found" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Email</th>
                <th>Phone</th>
                <th>KYC</th>
                <th>Account status</th>
                <th>Vehicles</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/clients/${c.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                      {c.company_name}
                    </Link>
                    {c.contact_person_name && (
                      <p className="text-xs text-[var(--color-text-muted)]">{c.contact_person_name}</p>
                    )}
                  </td>
                  <td>{labelify(c.client_type)}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td><Badge variant={kycStatusVariant(c.kyc_status)}>{labelify(c.kyc_status)}</Badge></td>
                  <td>
                    <Badge variant={c.account_status === "ACTIVE" ? "success" : c.account_status === "SUSPENDED" ? "warning" : "default"}>
                      {labelify(c.account_status)}
                    </Badge>
                  </td>
                  <td>{c.vehicle_count ?? 0}</td>
                  <td className="w-10">
                    <RowActions actions={[
                      { label: "View", to: `/clients/${c.id}` },
                      { label: "Edit", to: `/clients/${c.id}/edit` },
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
