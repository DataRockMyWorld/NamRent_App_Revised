import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { apiClient } from "@/services/apiClient";
import { Card, CardContent, CardTitle, CardHeader, PageLoader } from "@/components/ui";

interface FleetSummary {
  total_vehicles: number;
  active_vehicles: number;
  under_maintenance: number;
  pending_onboarding: number;
  out_of_service: number;
}

interface InvoiceSummary {
  total_invoices: number;
  overdue_invoices: number;
  overdue_amount: string;
  total_outstanding: string;
  paid_this_month: number;
}

interface MaintenanceSummary {
  open_requests: number;
  critical_requests: number;
  completed_this_month: number;
  by_type: Array<{ request_type: string; count: number }>;
}

const COLORS = ["#3B96E8", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function labelify(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ReportsPage() {
  const fleetQuery = useQuery({
    queryKey: ["reports", "fleet-summary"],
    queryFn: () => apiClient.get<FleetSummary>("/reports/fleet-summary/").then((r) => r.data),
  });

  const invoiceQuery = useQuery({
    queryKey: ["reports", "invoice-summary"],
    queryFn: () => apiClient.get<InvoiceSummary>("/reports/invoice-summary/").then((r) => r.data),
  });

  const maintenanceQuery = useQuery({
    queryKey: ["reports", "maintenance-summary"],
    queryFn: () =>
      apiClient.get<MaintenanceSummary>("/reports/maintenance-summary/").then((r) => r.data),
  });

  if (fleetQuery.isLoading || invoiceQuery.isLoading || maintenanceQuery.isLoading) {
    return <PageLoader />;
  }

  const fleet = fleetQuery.data;
  const invoice = invoiceQuery.data;
  const maintenance = maintenanceQuery.data;

  const fleetChartData = fleet
    ? [
        { name: "Active", value: fleet.active_vehicles },
        { name: "Maintenance", value: fleet.under_maintenance },
        { name: "Pending", value: fleet.pending_onboarding },
        { name: "Out of service", value: fleet.out_of_service ?? 0 },
      ]
    : [];

  const maintenanceByType = (maintenance?.by_type ?? []).map((d) => ({
    name: labelify(d.request_type),
    count: d.count,
  }));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Fleet and operations overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Fleet composition pie */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet composition</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={fleetChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {fleetChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Maintenance by type */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance requests by type</CardTitle>
          </CardHeader>
          <CardContent>
            {maintenanceByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={maintenanceByType} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B96E8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">No data available.</p>
            )}
          </CardContent>
        </Card>

        {/* Invoice summary */}
        {invoice && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Total invoices", value: invoice.total_invoices },
                  { label: "Overdue invoices", value: invoice.overdue_invoices },
                  { label: "Overdue amount", value: `N$ ${parseFloat(invoice.overdue_amount).toLocaleString()}` },
                  { label: "Total outstanding", value: `N$ ${parseFloat(invoice.total_outstanding).toLocaleString()}` },
                  { label: "Paid this month", value: invoice.paid_this_month },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">{item.label}</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Maintenance summary */}
        {maintenance && (
          <Card>
            <CardHeader>
              <CardTitle>Maintenance summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Open requests", value: maintenance.open_requests },
                  { label: "Critical requests", value: maintenance.critical_requests },
                  { label: "Completed this month", value: maintenance.completed_this_month },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">{item.label}</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
