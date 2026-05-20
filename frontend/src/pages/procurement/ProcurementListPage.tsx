import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, ShoppingCart } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { ProcurementRequest, PaginatedResponse } from "@/types";
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

function procurementStatusVariant(status: string) {
  if (["ACTIVE", "CONTRACTED"].includes(status)) return "success" as const;
  if (["SUBMITTED", "UNDER_REVIEW", "DEALERS_ASSIGNED", "OFFERS_RECEIVED"].includes(status)) return "info" as const;
  if (status === "OFFER_SELECTED") return "warning" as const;
  return "default" as const;
}

export default function ProcurementListPage() {
  const user = useAuthStore((s) => s.user);
  const isClient = user?.role && ["CLIENT_ADMIN"].includes(user.role);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["procurement", page, search],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<ProcurementRequest>>("/procurement/", {
          params: { page, search, page_size: PAGE_SIZE },
        })
        .then((r) => r.data),
  });

  const activeQ = useQuery({
    queryKey: ["procurement-stat", "active"],
    queryFn: () => apiClient.get<PaginatedResponse<ProcurementRequest>>("/procurement/", { params: { status: "ACTIVE", page_size: 1 } }).then(r => r.data.count),
  });
  const offersQ = useQuery({
    queryKey: ["procurement-stat", "offers"],
    queryFn: () => apiClient.get<PaginatedResponse<ProcurementRequest>>("/procurement/", { params: { status: "OFFERS_RECEIVED", page_size: 1 } }).then(r => r.data.count),
  });

  if (isLoading) return <ListPageSkeleton columns={9} stats={3} />;
  const requests = data?.results ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);


  return (
    <div className="page-container">
      <PageHeader
        title="Procurement"
        subtitle={`${data?.count ?? 0} requests`}
        action={isClient ? (
          <Link to="/procurement/new"><Button><Plus size={16} /> New request</Button></Link>
        ) : undefined}
        filters={
          <FilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search procurement requests…"
          />
        }
      />

      <InlineStatStrip stats={[
        { label: "Total", value: data?.count ?? 0 },
        { label: "Offers received", value: offersQ.data ?? 0, variant: "warning" },
        { label: "Active", value: activeQ.data ?? 0, variant: "success" },
      ]} />

      {requests.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No procurement requests" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Client</th>
                <th>Vehicle type</th>
                <th>Quantity</th>
                <th>Arrangement</th>
                <th>Offers</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/procurement/${r.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                      {r.reference_number}
                    </Link>
                  </td>
                  <td>{r.client_name}</td>
                  <td>{r.vehicle_type}</td>
                  <td>{r.quantity}</td>
                  <td>{labelify(r.arrangement_type)}</td>
                  <td>{r.offer_count ?? 0}</td>
                  <td><Badge variant={procurementStatusVariant(r.status)}>{labelify(r.status)}</Badge></td>
                  <td>{format(new Date(r.created_at), "d MMM yyyy")}</td>
                  <td className="w-10">
                    <RowActions actions={[
                      { label: "View", to: `/procurement/${r.id}` },
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
