import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Wrench } from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { Vehicle, MaintenanceRequest, PaginatedResponse } from "@/types";
import { labelify } from "@/utils/format";
import {
  Badge, vehicleStatusVariant, maintenanceStatusVariant, priorityVariant,
  Button, SectionCard, PageLoader, EmptyState, ConfirmModal,
  Tabs, DetailRow, ActivityTimeline, DetailHeader, QuickFacts,
} from "@/components/ui";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "maintenance", label: "Maintenance" },
  { id: "activity", label: "Activity" },
];

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isNamRent = user?.role && ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"].includes(user.role);
  const [tab, setTab] = useState("overview");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicles", id],
    queryFn: () => apiClient.get<Vehicle>(`/vehicles/${id}/`).then((r) => r.data),
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ["vehicles", id, "maintenance"],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<MaintenanceRequest>>("/maintenance/", {
          params: { vehicle: id, page_size: 50 },
        })
        .then((r) => r.data),
    enabled: tab === "maintenance",
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/vehicles/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      navigate("/vehicles");
    },
  });

  if (isLoading) return <PageLoader />;
  if (!vehicle) return <p className="page-container text-[var(--color-text-muted)]">Vehicle not found.</p>;

  const tabs = TABS.map((t) => ({
    ...t,
    count: t.id === "maintenance" ? maintenanceData?.count : undefined,
  }));

  const isExpiringSoon = (dateStr: string | null) => {
    if (!dateStr) return false;
    const daysLeft = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 30;
  };
  const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };
  const expiryClass = (dateStr: string | null) => {
    if (isExpired(dateStr)) return "text-[var(--color-danger)] font-semibold";
    if (isExpiringSoon(dateStr)) return "text-[var(--color-warning)] font-semibold";
    return "";
  };

  return (
    <div>
      <DetailHeader
        backTo="/vehicles"
        backLabel="Vehicles"
        title={vehicle.registration_number}
        subtitle={`${vehicle.year} ${vehicle.make} ${vehicle.model} · ${labelify(vehicle.colour)}`}
        badges={<Badge variant={vehicleStatusVariant(vehicle.current_status)}>{labelify(vehicle.current_status)}</Badge>}
        actions={isNamRent ? (
          <>
            <Link to={`/vehicles/${id}/edit`}>
              <Button variant="secondary" size="sm"><Pencil size={14} /> Edit</Button>
            </Link>
            <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          </>
        ) : undefined}
      />

      <div className="page-container">
        <QuickFacts facts={[
          { label: "Registration", value: vehicle.registration_number },
          { label: "Make / Model", value: `${vehicle.make} ${vehicle.model}` },
          { label: "Year", value: vehicle.year },
          { label: "Ownership", value: labelify(vehicle.ownership_type) },
          { label: "Client", value: vehicle.client_name },
          { label: "Insurance expiry", value: vehicle.insurance_expiry ? format(new Date(vehicle.insurance_expiry), "d MMM yyyy") : undefined },
        ]} />

        <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

        {tab === "overview" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SectionCard title="Vehicle Details">
              <DetailRow label="Registration" value={vehicle.registration_number} />
              <DetailRow label="VIN / Chassis" value={vehicle.vin} />
              <DetailRow label="Make" value={vehicle.make} />
              <DetailRow label="Model" value={vehicle.model} />
              <DetailRow label="Year" value={vehicle.year} />
              <DetailRow label="Colour" value={vehicle.colour} />
              <DetailRow label="Type" value={labelify(vehicle.vehicle_type)} />
              <DetailRow label="Fuel" value={labelify(vehicle.fuel_type)} />
              <DetailRow label="Transmission" value={labelify(vehicle.transmission)} />
              <DetailRow label="Mileage" value={vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : undefined} />
              <DetailRow label="Ownership" value={labelify(vehicle.ownership_type)} />
            </SectionCard>

            <SectionCard title="Assignment">
              <DetailRow
                label="Client"
                value={vehicle.client_name
                  ? <Link to={`/clients/${vehicle.assigned_client}`} className="text-[var(--color-primary)] hover:underline">{vehicle.client_name}</Link>
                  : undefined}
              />
              <DetailRow label="Driver" value={vehicle.driver_name} />
              <DetailRow label="Dealer source" value={vehicle.dealer_name} />
            </SectionCard>

            <SectionCard title="Insurance">
              <DetailRow label="Provider" value={vehicle.insurance_provider} />
              <DetailRow label="Policy number" value={vehicle.insurance_policy_number} />
              <DetailRow
                label="Start date"
                value={vehicle.insurance_start ? format(new Date(vehicle.insurance_start), "d MMM yyyy") : undefined}
              />
              <DetailRow
                label="Expiry date"
                value={vehicle.insurance_expiry
                  ? <span className={expiryClass(vehicle.insurance_expiry)}>{format(new Date(vehicle.insurance_expiry), "d MMM yyyy")}</span>
                  : undefined}
              />
            </SectionCard>

            <SectionCard title="Licensing & Tracking">
              <DetailRow label="License number" value={vehicle.license_number} />
              <DetailRow
                label="License expiry"
                value={vehicle.license_expiry
                  ? <span className={expiryClass(vehicle.license_expiry)}>{format(new Date(vehicle.license_expiry), "d MMM yyyy")}</span>
                  : undefined}
              />
              <DetailRow label="Tracking provider" value={vehicle.tracking_provider} />
              <DetailRow label="Device ID" value={vehicle.tracking_device_id} />
              <DetailRow label="Tracking status" value={vehicle.tracking_status ? labelify(vehicle.tracking_status) : undefined} />
              <DetailRow
                label="Tracking renewal"
                value={vehicle.tracking_renewal_date
                  ? <span className={expiryClass(vehicle.tracking_renewal_date)}>{format(new Date(vehicle.tracking_renewal_date), "d MMM yyyy")}</span>
                  : undefined}
              />
            </SectionCard>

            {vehicle.notes && (
              <SectionCard title="Notes" className="md:col-span-2">
                <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{vehicle.notes}</p>
              </SectionCard>
            )}
          </div>
        )}

        {tab === "maintenance" && (
          <div>
            {!maintenanceData || maintenanceData.results.length === 0 ? (
              <EmptyState icon={Wrench} title="No maintenance requests" description="No maintenance records exist for this vehicle." />
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Reported</th>
                      <th>Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceData.results.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link to={`/maintenance/${r.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                            {r.reference_number}
                          </Link>
                        </td>
                        <td>{labelify(r.request_type)}</td>
                        <td><Badge variant={priorityVariant(r.priority)}>{labelify(r.priority)}</Badge></td>
                        <td><Badge variant={maintenanceStatusVariant(r.status)}>{labelify(r.status)}</Badge></td>
                        <td>{format(new Date(r.created_at), "d MMM yyyy")}</td>
                        <td>{r.completion_date ? format(new Date(r.completion_date), "d MMM yyyy") : <span className="text-[var(--color-text-muted)]">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "activity" && id && (
          <SectionCard title="Activity">
            <ActivityTimeline contentType="vehicle" objectId={id} />
          </SectionCard>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete vehicle"
        description={`Are you sure you want to delete ${vehicle.registration_number}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        destructive
      />
    </div>
  );
}
