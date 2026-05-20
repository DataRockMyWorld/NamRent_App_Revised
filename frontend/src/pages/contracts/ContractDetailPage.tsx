import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Receipt } from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { Contract, Invoice, PaginatedResponse } from "@/types";
import { labelify, namibian } from "@/utils/format";
import {
  Badge, contractStatusVariant, invoiceStatusVariant,
  Button, SectionCard, PageLoader, EmptyState,
  Tabs, DetailRow, ActivityTimeline, DetailHeader, QuickFacts,
} from "@/components/ui";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "invoices", label: "Invoices" },
  { id: "activity", label: "Activity" },
];

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isNamRent = user?.role && ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"].includes(user.role);
  const [tab, setTab] = useState("overview");

  const { data: contract, isLoading } = useQuery({
    queryKey: ["contracts", id],
    queryFn: () => apiClient.get<Contract>(`/contracts/${id}/`).then((r) => r.data),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ["contracts", id, "invoices"],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Invoice>>("/invoices/", { params: { contract: id, page_size: 50 } })
        .then((r) => r.data),
    enabled: tab === "invoices",
  });

  if (isLoading) return <PageLoader />;
  if (!contract) return <p className="page-container">Contract not found.</p>;

  const tabs = TABS.map((t) => ({
    ...t,
    count: t.id === "invoices" ? invoicesData?.count : undefined,
  }));

  // Days remaining
  const daysLeft = Math.ceil((new Date(contract.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const daysLeftLabel =
    daysLeft < 0
      ? "Expired"
      : daysLeft === 0
      ? "Expires today"
      : `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`;

  return (
    <div>
      <DetailHeader
        backTo="/contracts"
        backLabel="Contracts"
        title={contract.contract_number}
        subtitle={`${contract.client_name} · ${daysLeftLabel}`}
        badges={<Badge variant={contractStatusVariant(contract.status)}>{labelify(contract.status)}</Badge>}
        actions={isNamRent ? (
          <Link to={`/contracts/${id}/edit`}>
            <Button variant="secondary" size="sm"><Pencil size={14} /> Edit</Button>
          </Link>
        ) : undefined}
      />

      <div className="page-container">
        <QuickFacts facts={[
          { label: "Client", value: contract.client_name },
          { label: "Pathway", value: labelify(contract.pathway_type) },
          { label: "Start", value: format(new Date(contract.start_date), "d MMM yyyy") },
          { label: "End", value: format(new Date(contract.end_date), "d MMM yyyy") },
          { label: "Monthly fee", value: namibian(contract.monthly_fee) },
        ]} />

        {/* Tabs */}
        <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionCard title="Contract Details">
            <DetailRow label="Contract number" value={contract.contract_number} />
            <DetailRow label="Client" value={<Link to={`/clients/${contract.client}`} className="text-[var(--color-primary)] hover:underline">{contract.client_name}</Link>} />
            <DetailRow label="Pathway" value={labelify(contract.pathway_type)} />
            <DetailRow label="Start date" value={format(new Date(contract.start_date), "d MMM yyyy")} />
            <DetailRow label="End date" value={format(new Date(contract.end_date), "d MMM yyyy")} />
            <DetailRow label="Duration" value={`${contract.duration_months} months`} />
            <DetailRow label="Vehicles" value={contract.vehicle_count ?? 0} />
            <DetailRow label="Renewal status" value={labelify(contract.renewal_status)} />
          </SectionCard>

          <SectionCard title="Financial">
            <DetailRow label="Monthly fee" value={<span className="text-lg font-bold text-[var(--color-text-primary)]">{namibian(contract.monthly_fee)}</span>} />
            <DetailRow label="Payment schedule" value={labelify(contract.payment_schedule)} />
            <div className="detail-row">
              <span className="detail-label">Services included</span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {contract.services_included.map((s) => (
                  <Badge key={s} variant="info">{s}</Badge>
                ))}
              </div>
            </div>
          </SectionCard>

          {contract.notes && (
            <SectionCard title="Notes" className="md:col-span-2">
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{contract.notes}</p>
            </SectionCard>
          )}
        </div>
      )}

      {/* Invoices */}
      {tab === "invoices" && (
        <div>
          {!invoicesData || invoicesData.results.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices" description="No invoices are linked to this contract yet." />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Issue date</th>
                    <th>Due date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoicesData.results.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <Link to={`/invoices/${inv.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td>{format(new Date(inv.issue_date), "d MMM yyyy")}</td>
                      <td>{format(new Date(inv.due_date), "d MMM yyyy")}</td>
                      <td className="font-medium">{namibian(inv.total_amount)}</td>
                      <td><Badge variant={invoiceStatusVariant(inv.status)}>{labelify(inv.status)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Activity */}
      {tab === "activity" && id && (
        <SectionCard title="Activity">
          <ActivityTimeline contentType="contract" objectId={id} />
        </SectionCard>
      )}
      </div>
    </div>
  );
}
