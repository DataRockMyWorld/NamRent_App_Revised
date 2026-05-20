import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { MaintenanceRequest } from "@/types";
import { labelify } from "@/utils/format";
import {
  Badge, maintenanceStatusVariant, priorityVariant,
  Button, SectionCard, PageLoader,
  Tabs, DetailRow, ActivityTimeline, DetailHeader, QuickFacts,
} from "@/components/ui";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
];

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isNamRent = user?.role && ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"].includes(user.role);
  const [tab, setTab] = useState("overview");

  const { data: req, isLoading } = useQuery({
    queryKey: ["maintenance", id],
    queryFn: () => apiClient.get<MaintenanceRequest>(`/maintenance/${id}/`).then((r) => r.data),
  });

  if (isLoading) return <PageLoader />;
  if (!req) return <p className="page-container">Request not found.</p>;

  return (
    <div>
      <DetailHeader
        backTo="/maintenance"
        backLabel="Maintenance"
        title={req.reference_number}
        subtitle={`${req.vehicle_display} · ${req.client_name}`}
        badges={
          <>
            <Badge variant={priorityVariant(req.priority)}>{labelify(req.priority)}</Badge>
            <Badge variant={maintenanceStatusVariant(req.status)}>{labelify(req.status)}</Badge>
          </>
        }
        actions={isNamRent ? (
          <Link to={`/maintenance/${id}/edit`}>
            <Button variant="secondary" size="sm"><Pencil size={14} /> Update</Button>
          </Link>
        ) : undefined}
      />

      <div className="page-container">
        <QuickFacts facts={[
          { label: "Vehicle", value: req.vehicle_display },
          { label: "Client", value: req.client_name },
          { label: "Type", value: labelify(req.request_type) },
          { label: "Priority", value: labelify(req.priority) },
          { label: "Status", value: labelify(req.status) },
        ]} />

        {/* Tabs */}
        <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-6" />

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionCard title="Request Details">
            <DetailRow label="Reference" value={req.reference_number} />
            <DetailRow label="Vehicle" value={<Link to={`/vehicles/${req.vehicle}`} className="text-[var(--color-primary)] hover:underline">{req.vehicle_display}</Link>} />
            <DetailRow label="Client" value={req.client_name} />
            <DetailRow label="Request type" value={labelify(req.request_type)} />
            <DetailRow label="Priority" value={<Badge variant={priorityVariant(req.priority)}>{labelify(req.priority)}</Badge>} />
            <DetailRow label="Reported by" value={req.reported_by_name} />
            <DetailRow label="Location" value={req.location_description} />
            <DetailRow label="Submitted" value={format(new Date(req.created_at), "d MMM yyyy, HH:mm")} />
          </SectionCard>

          <SectionCard title="Operations">
            <DetailRow label="Status" value={<Badge variant={maintenanceStatusVariant(req.status)}>{labelify(req.status)}</Badge>} />
            <DetailRow label="Assigned officer" value={req.assigned_officer_name} />
            <DetailRow label="Service provider" value={req.service_provider_name} />
            <DetailRow label="Cost estimate" value={req.cost_estimate ? `N$ ${req.cost_estimate}` : undefined} />
            <DetailRow label="Final cost" value={req.final_cost ? `N$ ${req.final_cost}` : undefined} />
            <DetailRow label="Scheduled date" value={req.scheduled_date ? format(new Date(req.scheduled_date), "d MMM yyyy") : undefined} />
            <DetailRow label="Completed" value={req.completion_date ? format(new Date(req.completion_date), "d MMM yyyy") : undefined} />
          </SectionCard>

          <SectionCard title="Description" className="md:col-span-2">
            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{req.description}</p>
          </SectionCard>

          {req.completion_notes && (
            <SectionCard title="Completion Notes" className="md:col-span-2">
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{req.completion_notes}</p>
            </SectionCard>
          )}
        </div>
      )}

      {/* Activity */}
      {tab === "activity" && id && (
        <SectionCard title="Activity">
          <ActivityTimeline contentType="maintenancerequest" objectId={id} />
        </SectionCard>
      )}
      </div>
    </div>
  );
}
