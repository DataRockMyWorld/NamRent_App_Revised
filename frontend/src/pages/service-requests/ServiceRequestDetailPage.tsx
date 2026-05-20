import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
// DetailHeader handles back navigation
import { apiClient } from "@/services/apiClient";
import type { ServiceRequest } from "@/types";
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

export default function ServiceRequestDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: req, isLoading } = useQuery({
    queryKey: ["service-requests", id],
    queryFn: () => apiClient.get<ServiceRequest>(`/service-requests/${id}/`).then((r) => r.data),
  });

  if (isLoading) return <PageLoader />;
  if (!req) return <p className="page-container">Request not found.</p>;

  return (
    <div>
      <DetailHeader
        backTo="/service-requests"
        backLabel="Service Requests"
        title={req.reference_number}
        subtitle={req.client_name}
        badges={<Badge variant="info">{labelify(req.status)}</Badge>}
      />

      <div className="page-container">
        <QuickFacts facts={[
          { label: "Client", value: req.client_name },
          { label: "Duration", value: `${req.duration_years} ${req.duration_years === 1 ? "year" : "years"}` },
          { label: "Vehicles", value: req.vehicle_count ?? 0 },
          { label: "Status", value: labelify(req.status) },
        ]} />

        <SectionCard title="Service Request Details">
          <DetailRow label="Reference" value={req.reference_number} />
          <DetailRow label="Client" value={req.client_name} />
          <DetailRow label="Duration" value={`${req.duration_years} ${req.duration_years === 1 ? "year" : "years"}`} />
          <DetailRow label="Vehicles" value={req.vehicle_count ?? 0} />
          <div className="detail-row">
            <span className="detail-label">Services</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {req.selected_services.map((s) => (
                <Badge key={s} variant="info">{s}</Badge>
              ))}
            </div>
          </div>
          <DetailRow label="Status" value={labelify(req.status)} />
          <DetailRow label="Submitted" value={req.submitted_at ? format(new Date(req.submitted_at), "d MMM yyyy") : undefined} />
          <DetailRow label="Created" value={format(new Date(req.created_at), "d MMM yyyy")} />
        </SectionCard>
      </div>
    </div>
  );
}
