import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// DetailHeader handles back navigation
import { apiClient } from "@/services/apiClient";
import type { TradeInRequest } from "@/types";
import { Badge, SectionCard, PageLoader, DetailHeader, QuickFacts } from "@/components/ui";
import { format } from "date-fns";

function labelify(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value ?? <span className="text-[var(--color-text-muted)]">—</span>}</span>
    </div>
  );
}

export default function TradeInDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: req, isLoading } = useQuery({
    queryKey: ["tradeins", id],
    queryFn: () => apiClient.get<TradeInRequest>(`/tradeins/${id}/`).then((r) => r.data),
  });

  if (isLoading) return <PageLoader />;
  if (!req) return <p className="page-container">Request not found.</p>;

  return (
    <div>
      <DetailHeader
        backTo="/tradeins"
        backLabel="Trade-ins"
        title={req.reference_number}
        subtitle={req.vehicle_display}
        badges={<Badge variant="info">{labelify(req.status)}</Badge>}
      />

      <div className="page-container">
        <QuickFacts facts={[
          { label: "Client", value: req.client_name },
          { label: "Vehicle", value: req.vehicle_display },
          { label: "Condition", value: labelify(req.trade_in_condition) },
          { label: "Status", value: labelify(req.status) },
        ]} />

        <SectionCard title="Trade-in Details">
          <DetailRow label="Reference" value={req.reference_number} />
          <DetailRow label="Client" value={req.client_name} />
          <DetailRow label="Vehicle" value={req.vehicle_display} />
          <DetailRow label="Condition" value={labelify(req.trade_in_condition)} />
          <DetailRow label="Status" value={labelify(req.status)} />
          <DetailRow label="Submitted" value={req.submitted_at ? format(new Date(req.submitted_at), "d MMM yyyy") : undefined} />
          <DetailRow label="Created" value={format(new Date(req.created_at), "d MMM yyyy")} />
        </SectionCard>
      </div>
    </div>
  );
}
