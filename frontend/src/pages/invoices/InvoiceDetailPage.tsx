import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { apiClient } from "@/services/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { Invoice } from "@/types";
import {
  Badge, invoiceStatusVariant, Button, SectionCard,
  Input, Select, Modal, PageLoader, DetailHeader, QuickFacts,
} from "@/components/ui";
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

const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  payment_method: z.enum(["EFT", "CASH", "OTHER"]),
  payment_date: z.string().min(1, "Date is required"),
  payment_reference: z.string().optional(),
});
type PaymentForm = z.infer<typeof paymentSchema>;

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isNamRent = user?.role && ["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"].includes(user.role);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoices", id],
    queryFn: () => apiClient.get<Invoice>(`/invoices/${id}/`).then((r) => r.data),
  });

  const paymentMutation = useMutation({
    mutationFn: (data: PaymentForm) =>
      apiClient.post(`/invoices/${id}/record_payment/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", id] });
      setPaymentOpen(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema) });

  if (isLoading) return <PageLoader />;
  if (!invoice) return <p className="page-container">Invoice not found.</p>;

  const canRecordPayment =
    isNamRent && !["PAID", "CANCELLED"].includes(invoice.status);

  return (
    <div>
      <DetailHeader
        backTo="/invoices"
        backLabel="Invoices"
        title={invoice.invoice_number}
        subtitle={invoice.client_name}
        badges={<Badge variant={invoiceStatusVariant(invoice.status)}>{labelify(invoice.status)}</Badge>}
        actions={
          <>
            {canRecordPayment && (
              <Button size="sm" onClick={() => setPaymentOpen(true)}>Record payment</Button>
            )}
            {isNamRent && (
              <Link to={`/invoices/${id}/edit`}>
                <Button variant="secondary" size="sm"><Pencil size={14} /> Edit</Button>
              </Link>
            )}
          </>
        }
      />

      <div className="page-container">
        <QuickFacts facts={[
          { label: "Client", value: invoice.client_name },
          { label: "Issue date", value: format(new Date(invoice.issue_date), "d MMM yyyy") },
          { label: "Due date", value: format(new Date(invoice.due_date), "d MMM yyyy") },
          { label: "Total", value: `N$ ${parseFloat(invoice.total_amount).toLocaleString()}` },
          { label: "Status", value: labelify(invoice.status) },
        ]} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="Invoice Details">
          <DetailRow label="Invoice number" value={invoice.invoice_number} />
          <DetailRow label="Client" value={invoice.client_name} />
          <DetailRow label="Contract" value={invoice.contract_number} />
          <DetailRow label="Issue date" value={format(new Date(invoice.issue_date), "d MMM yyyy")} />
          <DetailRow label="Due date" value={format(new Date(invoice.due_date), "d MMM yyyy")} />
          {invoice.period_start && (
            <DetailRow
              label="Period"
              value={`${format(new Date(invoice.period_start), "d MMM yyyy")} – ${invoice.period_end ? format(new Date(invoice.period_end), "d MMM yyyy") : ""}`}
            />
          )}
        </SectionCard>

        <SectionCard title="Financials">
          <DetailRow label="Subtotal" value={`N$ ${parseFloat(invoice.subtotal).toLocaleString()}`} />
          <DetailRow label={`VAT (${parseFloat(invoice.vat_rate) * 100}%)`} value={`N$ ${parseFloat(invoice.vat_amount).toLocaleString()}`} />
          <DetailRow label="Total" value={<span className="font-bold">N$ {parseFloat(invoice.total_amount).toLocaleString()}</span>} />
          {invoice.payment_date && (
            <>
              <DetailRow label="Payment method" value={invoice.payment_method ? labelify(invoice.payment_method) : undefined} />
              <DetailRow label="Payment date" value={format(new Date(invoice.payment_date), "d MMM yyyy")} />
              <DetailRow label="Payment reference" value={invoice.payment_reference} />
            </>
          )}
        </SectionCard>

        {/* Line items */}
        {invoice.items && invoice.items.length > 0 && (
          <SectionCard title="Line Items" className="md:col-span-2" noPadding>
            <div className="table-container border-0 rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Type</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td>{item.item_type}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">N$ {parseFloat(item.unit_price).toLocaleString()}</td>
                      <td className="text-right font-medium">N$ {parseFloat(item.line_total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {invoice.notes && (
          <SectionCard title="Notes" className="md:col-span-2">
            <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">{invoice.notes}</p>
          </SectionCard>
        )}
        </div>
      </div>

      {/* Record payment modal */}
      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Record payment" size="sm">
        <form
          onSubmit={handleSubmit((d) => paymentMutation.mutate(d))}
          noValidate
          className="space-y-4"
        >
          <Input
            label="Amount (NAD)"
            type="number"
            step="0.01"
            error={errors.amount?.message}
            {...register("amount")}
          />
          <Select
            label="Payment method"
            options={[
              { value: "EFT", label: "EFT" },
              { value: "CASH", label: "Cash" },
              { value: "OTHER", label: "Other" },
            ]}
            error={errors.payment_method?.message}
            {...register("payment_method")}
          />
          <Input
            label="Payment date"
            type="date"
            error={errors.payment_date?.message}
            {...register("payment_date")}
          />
          <Input
            label="Reference (optional)"
            {...register("payment_reference")}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPaymentOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={paymentMutation.isPending}>
              Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
