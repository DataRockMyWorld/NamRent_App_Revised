import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Car, FileText, Receipt } from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/services/apiClient";
import type { Client, Vehicle, Contract, Invoice, PaginatedResponse } from "@/types";
import { labelify, namibian } from "@/utils/format";
import {
  Badge, kycStatusVariant, vehicleStatusVariant, contractStatusVariant, invoiceStatusVariant,
  Button, SectionCard, PageLoader, EmptyState,
  Tabs, DetailRow, ActivityTimeline, DetailHeader, QuickFacts,
} from "@/components/ui";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "vehicles", label: "Vehicles" },
  { id: "contracts", label: "Contracts" },
  { id: "invoices", label: "Invoices" },
  { id: "activity", label: "Activity" },
];

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState("overview");

  const { data: client, isLoading } = useQuery({
    queryKey: ["clients", id],
    queryFn: () => apiClient.get<Client>(`/clients/${id}/`).then((r) => r.data),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["clients", id, "vehicles"],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Vehicle>>("/vehicles/", { params: { assigned_client: id, page_size: 50 } })
        .then((r) => r.data),
    enabled: tab === "vehicles",
  });

  const { data: contractsData } = useQuery({
    queryKey: ["clients", id, "contracts"],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Contract>>("/contracts/", { params: { client: id, page_size: 50 } })
        .then((r) => r.data),
    enabled: tab === "contracts",
  });

  const { data: invoicesData } = useQuery({
    queryKey: ["clients", id, "invoices"],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<Invoice>>("/invoices/", { params: { client: id, page_size: 50 } })
        .then((r) => r.data),
    enabled: tab === "invoices",
  });

  if (isLoading) return <PageLoader />;
  if (!client) return <p className="page-container">Client not found.</p>;

  const tabs = TABS.map((t) => ({
    ...t,
    count:
      t.id === "vehicles" ? client.vehicle_count :
      t.id === "contracts" ? contractsData?.count :
      t.id === "invoices" ? invoicesData?.count :
      undefined,
  }));

  return (
    <div>
      <DetailHeader
        backTo="/clients"
        backLabel="Clients"
        title={client.company_name}
        subtitle={[client.contact_person_title, client.contact_person_name].filter(Boolean).join(" ") + (client.city ? ` · ${client.city}` : "")}
        badges={
          <>
            <Badge variant={client.account_status === "ACTIVE" ? "success" : client.account_status === "SUSPENDED" ? "warning" : "default"}>
              {labelify(client.account_status)}
            </Badge>
            <Badge variant={kycStatusVariant(client.kyc_status)}>{labelify(client.kyc_status)}</Badge>
          </>
        }
        actions={
          <Link to={`/clients/${id}/edit`}>
            <Button variant="secondary" size="sm"><Pencil size={14} /> Edit</Button>
          </Link>
        }
      />

      <div className="page-container">
        <QuickFacts facts={[
          { label: "Contact", value: [client.contact_person_title, client.contact_person_name].filter(Boolean).join(" ") || undefined },
          { label: "City", value: client.city },
          { label: "Account", value: labelify(client.account_status) },
          { label: "KYC", value: labelify(client.kyc_status) },
          { label: "Vehicles", value: client.vehicle_count ?? 0 },
        ]} />

        {/* Tabs */}
        <Tabs tabs={tabs} active={tab} onChange={setTab} className="mb-6" />

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionCard title="Contact">
            <DetailRow label="Client type" value={labelify(client.client_type)} />
            <DetailRow label="Email" value={<a href={`mailto:${client.email}`} className="text-[var(--color-primary)] hover:underline">{client.email}</a>} />
            <DetailRow label="Phone" value={client.phone} />
            <DetailRow label="Alt phone" value={client.alt_phone} />
            <DetailRow label="Registration no." value={client.registration_number} />
          </SectionCard>

          <SectionCard title="Address">
            <DetailRow label="Address" value={[client.address_line_1, client.address_line_2].filter(Boolean).join(", ")} />
            <DetailRow label="City" value={client.city} />
            <DetailRow label="Province" value={client.province} />
            <DetailRow label="Postal code" value={client.postal_code} />
            <DetailRow label="Country" value={client.country} />
          </SectionCard>

          <SectionCard title="Account">
            <DetailRow label="Account status" value={labelify(client.account_status)} />
            <DetailRow label="KYC status" value={labelify(client.kyc_status)} />
            <DetailRow label="Vehicles" value={client.vehicle_count ?? 0} />
            <DetailRow label="Account manager" value={client.account_manager_name} />
            <DetailRow label="Created" value={format(new Date(client.created_at), "d MMM yyyy")} />
          </SectionCard>

          {client.notes && (
            <SectionCard title="Notes">
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">{client.notes}</p>
            </SectionCard>
          )}
        </div>
      )}

      {/* Vehicles */}
      {tab === "vehicles" && (
        <div>
          {!vehiclesData || vehiclesData.results.length === 0 ? (
            <EmptyState icon={Car} title="No vehicles" description="No vehicles are assigned to this client." />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Registration</th>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Ownership</th>
                    <th>Status</th>
                    <th>Insurance expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclesData.results.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <Link to={`/vehicles/${v.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                          {v.registration_number}
                        </Link>
                      </td>
                      <td>{v.year} {v.make} {v.model}</td>
                      <td>{labelify(v.vehicle_type)}</td>
                      <td>{labelify(v.ownership_type)}</td>
                      <td><Badge variant={vehicleStatusVariant(v.current_status)}>{labelify(v.current_status)}</Badge></td>
                      <td>{v.insurance_expiry ? format(new Date(v.insurance_expiry), "d MMM yyyy") : <span className="text-[var(--color-text-muted)]">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Contracts */}
      {tab === "contracts" && (
        <div>
          {!contractsData || contractsData.results.length === 0 ? (
            <EmptyState icon={FileText} title="No contracts" description="No contracts exist for this client." />
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Contract #</th>
                    <th>Pathway</th>
                    <th>Start date</th>
                    <th>End date</th>
                    <th>Monthly fee</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contractsData.results.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/contracts/${c.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                          {c.contract_number}
                        </Link>
                      </td>
                      <td>{labelify(c.pathway_type)}</td>
                      <td>{format(new Date(c.start_date), "d MMM yyyy")}</td>
                      <td>{format(new Date(c.end_date), "d MMM yyyy")}</td>
                      <td>{namibian(c.monthly_fee)}</td>
                      <td><Badge variant={contractStatusVariant(c.status)}>{labelify(c.status)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invoices */}
      {tab === "invoices" && (
        <div>
          {!invoicesData || invoicesData.results.length === 0 ? (
            <EmptyState icon={Receipt} title="No invoices" description="No invoices exist for this client." />
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
          <ActivityTimeline contentType="client" objectId={id} />
        </SectionCard>
      )}
      </div>
    </div>
  );
}
