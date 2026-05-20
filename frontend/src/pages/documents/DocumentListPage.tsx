import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, Download } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import type { PaginatedResponse } from "@/types";
import { ListPageSkeleton, EmptyState, FilterBar, InlineStatStrip } from "@/components/ui";
import { PageHeader } from "@/components/layout/PageHeader";
import { format } from "date-fns";

interface Document {
  id: string;
  title: string;
  category: string;
  file_url: string;
  status: string;
  expiry_date: string | null;
  uploaded_by_name: string;
  created_at: string;
}

const PAGE_SIZE = 20;

function labelify(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DocumentListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["documents", page, search],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Document>>("/documents/", {
          params: { page, search, page_size: PAGE_SIZE },
        })
        .then((r) => r.data),
  });

  if (isLoading) return <ListPageSkeleton columns={7} stats={2} />;
  const docs = data?.results ?? [];

  // Derive expiring count from current page (within 30 days)
  const now = new Date();
  const expiringCount = docs.filter(d => {
    if (!d.expiry_date) return false;
    const daysLeft = (new Date(d.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 30;
  }).length;

  return (
    <div className="page-container">
      <PageHeader
        title="Documents"
        subtitle={`${data?.count ?? 0} documents`}
        filters={
          <FilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search documents…"
          />
        }
      />

      <InlineStatStrip stats={[
        { label: "Total", value: data?.count ?? 0 },
        { label: "Expiring soon (this page)", value: expiringCount, variant: expiringCount > 0 ? "warning" : "default" },
      ]} />

      {docs.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents found" />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Expiry</th>
                <th>Uploaded by</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.title}</td>
                  <td>{labelify(d.category)}</td>
                  <td>{labelify(d.status)}</td>
                  <td>
                    {d.expiry_date
                      ? format(new Date(d.expiry_date), "d MMM yyyy")
                      : <span className="text-[var(--color-text-muted)]">—</span>}
                  </td>
                  <td>{d.uploaded_by_name}</td>
                  <td>{format(new Date(d.created_at), "d MMM yyyy")}</td>
                  <td>
                    <a
                      href={d.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--color-primary)] hover:underline flex items-center gap-1 text-sm"
                    >
                      <Download size={14} /> Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
