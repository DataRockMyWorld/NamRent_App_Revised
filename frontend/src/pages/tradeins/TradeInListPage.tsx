import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, ArrowLeftRight } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { TradeInRequest, PaginatedResponse } from "@/types";
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

export default function TradeInListPage() {
  const user = useAuthStore((s) => s.user);
  const isClient = user?.role && ["CLIENT_ADMIN"].includes(user.role);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["tradeins", page, search],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<TradeInRequest>>("/tradeins/", {
          params: { page, search, page_size: PAGE_SIZE },
        })
        .then((r) => r.data),
  });

  if (isLoading) return <ListPageSkeleton columns={7} stats={3} />;
  const requests = data?.results ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  // Derive status counts from current page (approximate)
  const openCount = requests.filter(r => !(["COMPLETED", "CANCELLED", "REJECTED"] as string[]).includes(r.status)).length;
  const completedCount = requests.filter(r => (r.status as string) === "COMPLETED").length;

  return (
    <div className="page-container">
      <PageHeader
        title="Trade-ins"
        subtitle={`${data?.count ?? 0} requests`}
        action={isClient ? (
          <Link to="/tradeins/new"><Button><Plus size={16} /> New trade-in</Button></Link>
        ) : undefined}
        filters={
          <FilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search trade-in requests…"
          />
        }
      />

      <InlineStatStrip stats={[
        { label: "Total", value: data?.count ?? 0 },
        { label: "Open (this page)", value: openCount, variant: "primary" },
        { label: "Completed (this page)", value: completedCount, variant: "success" },
      ]} />

      {requests.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No trade-in requests" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Client</th>
                <th>Vehicle</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/tradeins/${r.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                      {r.reference_number}
                    </Link>
                  </td>
                  <td>{r.client_name}</td>
                  <td>{r.vehicle_display}</td>
                  <td>{labelify(r.trade_in_condition)}</td>
                  <td><Badge variant="info">{labelify(r.status)}</Badge></td>
                  <td>{format(new Date(r.created_at), "d MMM yyyy")}</td>
                  <td className="w-10">
                    <RowActions actions={[
                      { label: "View", to: `/tradeins/${r.id}` },
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
