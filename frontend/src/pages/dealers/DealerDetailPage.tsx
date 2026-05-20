import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import type { Dealer } from "@/types";
import { Badge, Button, SectionCard, PageLoader, DetailHeader, QuickFacts } from "@/components/ui";
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

export default function DealerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: dealer, isLoading } = useQuery({
    queryKey: ["dealers", id],
    queryFn: () => apiClient.get<Dealer>(`/dealers/${id}/`).then((r) => r.data),
  });

  if (isLoading) return <PageLoader />;
  if (!dealer) return <p className="page-container">Dealer not found.</p>;

  return (
    <div>
      <DetailHeader
        backTo="/dealers"
        backLabel="Dealers"
        title={dealer.dealer_name}
        subtitle={`${dealer.city}, ${dealer.country}`}
        badges={
          <Badge variant={dealer.dealer_status === "ACTIVE" ? "success" : dealer.dealer_status === "SUSPENDED" ? "warning" : "default"}>
            {labelify(dealer.dealer_status)}
          </Badge>
        }
        actions={
          <Link to={`/dealers/${id}/edit`}>
            <Button variant="secondary" size="sm"><Pencil size={14} /> Edit</Button>
          </Link>
        }
      />

      <div className="page-container">
        <QuickFacts facts={[
          { label: "Contact", value: dealer.contact_person },
          { label: "City", value: dealer.city },
          { label: "Status", value: labelify(dealer.dealer_status) },
          { label: "Brands", value: dealer.brands_supplied.length > 0 ? dealer.brands_supplied.slice(0, 3).join(", ") : undefined },
        ]} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="Contact">
          <DetailRow label="Contact person" value={dealer.contact_person} />
          <DetailRow label="Email" value={dealer.email} />
          <DetailRow label="Phone" value={dealer.phone} />
          <DetailRow label="Address" value={dealer.address} />
          <DetailRow label="City" value={dealer.city} />
          <DetailRow label="Province" value={dealer.province} />
          <DetailRow label="Country" value={dealer.country} />
        </SectionCard>

        <SectionCard title="Business">
          <DetailRow label="VAT number" value={dealer.vat_number} />
          <DetailRow label="Registration number" value={dealer.registration_number} />
          <DetailRow label="Created" value={format(new Date(dealer.created_at), "d MMM yyyy")} />
          <div className="detail-row">
            <span className="detail-label">Brands supplied</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {dealer.brands_supplied.map((b) => (
                <Badge key={b} variant="info">{b}</Badge>
              ))}
            </div>
          </div>
        </SectionCard>

        {dealer.notes && (
          <SectionCard title="Notes" className="md:col-span-2">
            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{dealer.notes}</p>
          </SectionCard>
        )}
        </div>
      </div>
    </div>
  );
}
