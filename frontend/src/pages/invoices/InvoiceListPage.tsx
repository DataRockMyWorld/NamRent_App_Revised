import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Receipt } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { Invoice, PaginatedResponse } from "@/types";
import {
  Button, Badge, invoiceStatusVariant, ListPageSkeleton, EmptyState, FilterBar, FilterSelect,
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
  { value: "SENT", label: "Sent" },
  { value: "VIEWED", label: "Viewed" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function InvoiceListPage() {
  const user = useAuthStore((s) => s.user);
  const isNamRent = user?.role && ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"].includes(user.role);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", page, search, status],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Invoice>>("/invoices/", {
          params: { page, search, status: status || undefined, page_size: PAGE_SIZE },
        })
        .then((r) => r.data),
  });

  const overdueQ = useQuery({
    queryKey: ["invoices-stat", "overdue"],
    queryFn: () => apiClient.get<PaginatedResponse<Invoice>>("/invoices/", { params: { status: "OVERDUE", page_size: 1 } }).then(r => r.data.count),
  });
  const sentQ = useQuery({
    queryKey: ["invoices-stat", "sent"],
    queryFn: () => apiClient.get<PaginatedResponse<Invoice>>("/invoices/", { params: { status: "SENT", page_size: 1 } }).then(r => r.data.count),
  });
  const paidQ = useQuery({
    queryKey: ["invoices-stat", "paid"],
    queryFn: () => apiClient.get<PaginatedResponse<Invoice>>("/invoices/", { params: { status: "PAID", page_size: 1 } }).then(r => r.data.count),
  });

  if (isLoading) return <ListPageSkeleton columns={6} stats={4} />;
  const invoices = data?.results ?? [];
  const totalPages = Math.ceil((data?.count ?? 0) / PAGE_SIZE);

  return (
    <div className="page-container">
      <PageHeader
        title="Invoices"
        subtitle={`${data?.count ?? 0} invoices`}
        action={isNamRent ? (
          <Link to="/invoices/new"><Button><Plus size={16} /> New invoice</Button></Link>
        ) : undefined}
        filters={
          <FilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search invoice number, client…"
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
        { label: "Overdue", value: overdueQ.data ?? 0, variant: "danger" },
        { label: "Sent / Pending", value: sentQ.data ?? 0, variant: "warning" },
        { label: "Paid", value: paidQ.data ?? 0, variant: "success" },
      ]} />

      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices found" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Issue date</th>
                <th>Due date</th>
                <th>Total</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link to={`/invoices/${inv.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td>{inv.client_name}</td>
                  <td>{format(new Date(inv.issue_date), "d MMM yyyy")}</td>
                  <td>{format(new Date(inv.due_date), "d MMM yyyy")}</td>
                  <td className="font-medium">N$ {parseFloat(inv.total_amount).toLocaleString()}</td>
                  <td><Badge variant={invoiceStatusVariant(inv.status)}>{labelify(inv.status)}</Badge></td>
                  <td className="w-10">
                    <RowActions actions={[
                      { label: "View", to: `/invoices/${inv.id}` },
                      ...(isNamRent ? [{ label: "Edit", to: `/invoices/${inv.id}/edit` }] : []),
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
