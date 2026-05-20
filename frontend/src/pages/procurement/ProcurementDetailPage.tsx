import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { ProcurementRequest, DealerOffer, PaginatedResponse } from "@/types";
import { labelify, namibian } from "@/utils/format";
import {
  Badge, Button, SectionCard, PageLoader, Modal,
  Input, Tabs, DetailRow, ActivityTimeline, EmptyState, DetailHeader, QuickFacts,
} from "@/components/ui";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "offers", label: "Offers" },
  { id: "activity", label: "Activity" },
];

const offerSchema = z.object({
  vehicle_make:   z.string().min(1, "Required"),
  vehicle_model:  z.string().min(1, "Required"),
  vehicle_year:   z.string().min(1, "Required"),
  vehicle_colour: z.string().min(1, "Required"),
  offered_price:  z.string().min(1, "Required"),
});
type OfferForm = z.infer<typeof offerSchema>;

function offerStatusVariant(s: string) {
  if (s === "ACCEPTED") return "success" as const;
  if (s === "REJECTED") return "danger" as const;
  if (s === "SUBMITTED") return "info" as const;
  return "default" as const;
}

export default function ProcurementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isDealer = user?.role === "DEALER_ADMIN";

  const [tab, setTab] = useState("overview");
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  const { data: req, isLoading } = useQuery({
    queryKey: ["procurement", id],
    queryFn: () => apiClient.get<ProcurementRequest>(`/procurement/${id}/`).then((r) => r.data),
  });

  const { data: offersData } = useQuery({
    queryKey: ["procurement", id, "offers"],
    queryFn: () =>
      apiClient.get<PaginatedResponse<DealerOffer>>("/procurement/offers/", { params: { procurement_request: id, page_size: 50 } }).then(r => r.data),
    enabled: tab === "offers",
  });

  const offerMutation = useMutation({
    mutationFn: (data: OfferForm) =>
      apiClient.post("/procurement/offers/", { ...data, procurement_request: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procurement", id, "offers"] });
      setOfferOpen(false);
      setOfferError(null);
      reset();
    },
    onError: () => setOfferError("Failed to submit offer. Please try again."),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OfferForm>({
    resolver: zodResolver(offerSchema),
  });

  if (isLoading) return <PageLoader />;
  if (!req) return <p className="page-container">Request not found.</p>;

  const canSubmitOffer = isDealer && ["DEALERS_ASSIGNED", "OFFERS_RECEIVED"].includes(req.status);

  const tabs = TABS.map((t) => ({
    ...t,
    count: t.id === "offers" ? (req.offer_count ?? offersData?.count) : undefined,
  }));

  return (
    <div>
      <DetailHeader
        backTo="/procurement"
        backLabel="Procurement"
        title={req.reference_number}
        subtitle={`${req.client_name} · ${req.quantity} × ${req.vehicle_type}`}
        badges={<Badge variant="info">{labelify(req.status)}</Badge>}
        actions={canSubmitOffer ? (
          <Button size="sm" onClick={() => setOfferOpen(true)}>
            <Plus size={14} /> Submit offer
          </Button>
        ) : undefined}
      />

      <div className="page-container">
        <QuickFacts facts={[
          { label: "Client", value: req.client_name },
          { label: "Vehicle type", value: req.vehicle_type },
          { label: "Quantity", value: req.quantity },
          { label: "Arrangement", value: labelify(req.arrangement_type) },
          { label: "Status", value: labelify(req.status) },
        ]} />

        <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

      {tab === "overview" && (
        <SectionCard title="Request Details">
          <DetailRow label="Reference" value={req.reference_number} />
          <DetailRow label="Client" value={req.client_name} />
          <DetailRow label="Vehicle type" value={req.vehicle_type} />
          <DetailRow label="Quantity" value={req.quantity} />
          <DetailRow label="Arrangement" value={labelify(req.arrangement_type)} />
          <DetailRow label="Status" value={labelify(req.status)} />
          <DetailRow label="Offers received" value={req.offer_count ?? 0} />
          <DetailRow label="Submitted" value={req.submitted_at ? format(new Date(req.submitted_at), "d MMM yyyy") : undefined} />
          <DetailRow label="Created" value={format(new Date(req.created_at), "d MMM yyyy")} />
        </SectionCard>
      )}

      {tab === "offers" && (
        <div>
          {!offersData || offersData.results.length === 0 ? (
            <EmptyState
              title="No offers yet"
              description="Dealer offers will appear here once submitted."
              action={canSubmitOffer ? <Button onClick={() => setOfferOpen(true)}><Plus size={14} /> Submit offer</Button> : undefined}
            />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Dealer</th>
                    <th>Vehicle</th>
                    <th>Year</th>
                    <th>Colour</th>
                    <th>Offered price</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {offersData.results.map((o) => (
                    <tr key={o.id}>
                      <td className="font-medium">{o.dealer_name}</td>
                      <td>{o.vehicle_make} {o.vehicle_model}</td>
                      <td>{o.vehicle_year}</td>
                      <td>{o.vehicle_colour}</td>
                      <td className="font-semibold">{namibian(o.offered_price)}</td>
                      <td><Badge variant={offerStatusVariant(o.status)}>{labelify(o.status)}</Badge></td>
                      <td>{o.submitted_at ? format(new Date(o.submitted_at), "d MMM yyyy") : <span className="text-[var(--color-text-muted)]">—</span>}</td>
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
          <ActivityTimeline contentType="procurementrequest" objectId={id} />
        </SectionCard>
      )}
      </div>

      {/* Submit offer modal */}
      <Modal open={offerOpen} onClose={() => { setOfferOpen(false); setOfferError(null); reset(); }} title="Submit vehicle offer" size="md">
        <form onSubmit={handleSubmit((d) => offerMutation.mutate(d))} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Make" placeholder="e.g. Toyota" error={errors.vehicle_make?.message} {...register("vehicle_make")} />
            <Input label="Model" placeholder="e.g. Hilux" error={errors.vehicle_model?.message} {...register("vehicle_model")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Year" type="number" placeholder={String(new Date().getFullYear())} error={errors.vehicle_year?.message} {...register("vehicle_year")} />
            <Input label="Colour" placeholder="e.g. White" error={errors.vehicle_colour?.message} {...register("vehicle_colour")} />
          </div>
          <Input label="Offered price (NAD)" type="number" step="0.01" error={errors.offered_price?.message} {...register("offered_price")} />
          {offerError && (
            <p className="rounded-lg bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">{offerError}</p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => { setOfferOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={offerMutation.isPending}>Submit offer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
