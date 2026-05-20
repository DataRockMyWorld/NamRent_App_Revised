import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, FileText } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { Contract, PaginatedResponse } from "@/types";
import {
  Button, Badge, contractStatusVariant, ListPageSkeleton, EmptyState, FilterBar, FilterSelect,
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
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "EXPIRED", label: "Expired" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "RENEWED", label: "Renewed" },
];

export default function ContractListPage() {
  const user = useAuthStore((s) => s.user);
  const isNamRent = user?.role && ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"].includes(user.role);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["contracts", page, search, status],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Contract>>("/contracts/", {
          params: { page, search, status: status || undefined, page_size: PAGE_SIZE },
        })
        .then((r) => r.data),
  });

  const activeQ = useQuery({
    queryKey: ["contracts-stat", "active"],
    queryFn: () => apiClient.get<PaginatedResponse<Contract>>("/contracts/", { params: { status: "ACTIVE", page_size: 1 } }).then(r => r.data.count),
  });
  const pendingQ = useQuery({
    queryKey: ["contracts-stat", "pending"],
    queryFn: () => apiClient.get<PaginatedResponse<Contract>>("/contracts/", { params: { status: "PENDING_APPROVAL", page_size: 1 } }).then(r => r.data.count),
  });
  const expiredQ = useQuery({
    queryKey: ["contracts-stat", "expired"],
    queryFn: () => apiClient.get<PaginatedResponse<Contract>>("/contracts/", { params: { status: "EXPIRED", page_size: 1 } }).then(r => r.data.count),
  });

  if (isLoading) return <ListPageSkeleton columns={7} stats={4} />;
  const contracts = data?.results ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  return (
    <div className="page-container">
      <PageHeader
        title="Contracts"
        subtitle={`${data?.count ?? 0} contracts`}
        action={isNamRent ? (
          <Link to="/contracts/new"><Button><Plus size={16} /> New contract</Button></Link>
        ) : undefined}
        filters={
          <FilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search contract number, client…"
            hasActiveFilters={!!(search || status)}
            onClearFilters={() => { setSearch(""); setStatus(""); setPage(1); }}
            filters={
              <FilterSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </FilterSelect>
            }
          />
        }
      />

      <InlineStatStrip stats={[
        { label: "Total", value: data?.count ?? 0 },
        { label: "Active", value: activeQ.data ?? 0, variant: "success" },
        { label: "Pending approval", value: pendingQ.data ?? 0, variant: "warning" },
        { label: "Expired", value: expiredQ.data ?? 0, variant: "danger" },
      ]} />

      {contracts.length === 0 ? (
        <EmptyState icon={FileText} title="No contracts found" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Contract #</th>
                <th>Client</th>
                <th>Pathway</th>
                <th>Start date</th>
                <th>End date</th>
                <th>Monthly fee</th>
                <th>Vehicles</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/contracts/${c.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                      {c.contract_number}
                    </Link>
                  </td>
                  <td>{c.client_name}</td>
                  <td>{labelify(c.pathway_type)}</td>
                  <td>{format(new Date(c.start_date), "d MMM yyyy")}</td>
                  <td>{format(new Date(c.end_date), "d MMM yyyy")}</td>
                  <td>N$ {parseFloat(c.monthly_fee).toLocaleString()}</td>
                  <td>{c.vehicle_count ?? 0}</td>
                  <td><Badge variant={contractStatusVariant(c.status)}>{labelify(c.status)}</Badge></td>
                  <td className="w-10">
                    <RowActions actions={[
                      { label: "View", to: `/contracts/${c.id}` },
                      ...(isNamRent ? [{ label: "Edit", to: `/contracts/${c.id}/edit` }] : []),
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
