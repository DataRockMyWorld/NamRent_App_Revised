import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import type { Dealer, PaginatedResponse } from "@/types";
import {
  Button, Badge, ListPageSkeleton, EmptyState, FilterBar,
  InlineStatStrip, RowActions,
} from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";

const PAGE_SIZE = 20;

function labelify(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DealerListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["dealers", page, search],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Dealer>>("/dealers/", { params: { page, search, page_size: PAGE_SIZE } })
        .then((r) => r.data),
  });

  const activeQ = useQuery({
    queryKey: ["dealers-stat", "active"],
    queryFn: () => apiClient.get<PaginatedResponse<Dealer>>("/dealers/", { params: { dealer_status: "ACTIVE", page_size: 1 } }).then(r => r.data.count),
  });
  const inactiveQ = useQuery({
    queryKey: ["dealers-stat", "inactive"],
    queryFn: () => apiClient.get<PaginatedResponse<Dealer>>("/dealers/", { params: { dealer_status: "INACTIVE", page_size: 1 } }).then(r => r.data.count),
  });
  const suspendedQ = useQuery({
    queryKey: ["dealers-stat", "suspended"],
    queryFn: () => apiClient.get<PaginatedResponse<Dealer>>("/dealers/", { params: { dealer_status: "SUSPENDED", page_size: 1 } }).then(r => r.data.count),
  });

  if (isLoading) return <ListPageSkeleton columns={5} stats={4} />;
  const dealers = data?.results ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  return (
    <div className="page-container">
      <PageHeader
        title="Dealers"
        subtitle={`${data?.count ?? 0} dealers`}
        action={<Link to="/dealers/new"><Button><Plus size={16} /> Add dealer</Button></Link>}
        filters={
          <FilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search dealers…"
          />
        }
      />

      <InlineStatStrip stats={[
        { label: "Total", value: data?.count ?? 0 },
        { label: "Active", value: activeQ.data ?? 0, variant: "success" },
        { label: "Inactive", value: inactiveQ.data ?? 0, variant: "default" },
        { label: "Suspended", value: suspendedQ.data ?? 0, variant: "danger" },
      ]} />

      {dealers.length === 0 ? (
        <EmptyState icon={Users} title="No dealers found" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Dealer</th>
                <th>Contact</th>
                <th>City</th>
                <th>Brands</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {dealers.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link to={`/dealers/${d.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                      {d.dealer_name}
                    </Link>
                  </td>
                  <td>
                    <p>{d.contact_person}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{d.email}</p>
                  </td>
                  <td>{d.city}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {d.brands_supplied.slice(0, 3).map((b) => (
                        <Badge key={b} variant="default">{b}</Badge>
                      ))}
                      {d.brands_supplied.length > 3 && (
                        <Badge variant="default">+{d.brands_supplied.length - 3}</Badge>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge variant={d.dealer_status === "ACTIVE" ? "success" : d.dealer_status === "SUSPENDED" ? "warning" : "default"}>
                      {labelify(d.dealer_status)}
                    </Badge>
                  </td>
                  <td className="w-10">
                    <RowActions actions={[
                      { label: "View", to: `/dealers/${d.id}` },
                      { label: "Edit", to: `/dealers/${d.id}/edit` },
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
