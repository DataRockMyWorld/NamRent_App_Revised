import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PageLoader } from "@/components/ui/LoadingSpinner";

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// Auth pages
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const AcceptInvitationPage = lazy(() => import("@/pages/auth/AcceptInvitationPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));

// App pages
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const VehicleListPage = lazy(() => import("@/pages/vehicles/VehicleListPage"));
const VehicleDetailPage = lazy(() => import("@/pages/vehicles/VehicleDetailPage"));
const VehicleFormPage = lazy(() => import("@/pages/vehicles/VehicleFormPage"));
const ClientListPage = lazy(() => import("@/pages/clients/ClientListPage"));
const ClientDetailPage = lazy(() => import("@/pages/clients/ClientDetailPage"));
const DealerListPage = lazy(() => import("@/pages/dealers/DealerListPage"));
const DealerDetailPage = lazy(() => import("@/pages/dealers/DealerDetailPage"));
const MaintenanceListPage = lazy(() => import("@/pages/maintenance/MaintenanceListPage"));
const MaintenanceDetailPage = lazy(() => import("@/pages/maintenance/MaintenanceDetailPage"));
const ContractListPage = lazy(() => import("@/pages/contracts/ContractListPage"));
const ContractDetailPage = lazy(() => import("@/pages/contracts/ContractDetailPage"));
const InvoiceListPage = lazy(() => import("@/pages/invoices/InvoiceListPage"));
const InvoiceDetailPage = lazy(() => import("@/pages/invoices/InvoiceDetailPage"));
const ProcurementListPage = lazy(() => import("@/pages/procurement/ProcurementListPage"));
const ProcurementDetailPage = lazy(() => import("@/pages/procurement/ProcurementDetailPage"));
const TradeInListPage = lazy(() => import("@/pages/tradeins/TradeInListPage"));
const TradeInDetailPage = lazy(() => import("@/pages/tradeins/TradeInDetailPage"));
const ServiceRequestListPage = lazy(() => import("@/pages/service-requests/ServiceRequestListPage"));
const ServiceRequestDetailPage = lazy(() => import("@/pages/service-requests/ServiceRequestDetailPage"));
const DocumentListPage = lazy(() => import("@/pages/documents/DocumentListPage"));
const NotificationListPage = lazy(() => import("@/pages/notifications/NotificationListPage"));
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"));
const SettingsPage = lazy(() => import("@/pages/settings/SettingsPage"));
const UsersPage = lazy(() => import("@/pages/users/UsersPage"));

export const router = createBrowserRouter([
  // Auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: withSuspense(LoginPage) },
      { path: "/invitations/:token/accept", element: withSuspense(AcceptInvitationPage) },
      { path: "/forgot-password", element: withSuspense(ForgotPasswordPage) },
      { path: "/reset-password", element: withSuspense(ResetPasswordPage) },
    ],
  },

  // Protected app routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: withSuspense(DashboardPage) },

          // Vehicles
          { path: "/vehicles", element: withSuspense(VehicleListPage) },
          { path: "/vehicles/new", element: withSuspense(VehicleFormPage) },
          { path: "/vehicles/:id", element: withSuspense(VehicleDetailPage) },
          { path: "/vehicles/:id/edit", element: withSuspense(VehicleFormPage) },

          // Clients (NamRent staff only)
          {
            element: <ProtectedRoute allowedRoles={["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"]} />,
            children: [
              { path: "/clients", element: withSuspense(ClientListPage) },
              { path: "/clients/:id", element: withSuspense(ClientDetailPage) },
              { path: "/dealers", element: withSuspense(DealerListPage) },
              { path: "/dealers/:id", element: withSuspense(DealerDetailPage) },
            ],
          },

          // Maintenance
          { path: "/maintenance", element: withSuspense(MaintenanceListPage) },
          { path: "/maintenance/:id", element: withSuspense(MaintenanceDetailPage) },

          // Contracts
          { path: "/contracts", element: withSuspense(ContractListPage) },
          { path: "/contracts/:id", element: withSuspense(ContractDetailPage) },

          // Invoices
          { path: "/invoices", element: withSuspense(InvoiceListPage) },
          { path: "/invoices/:id", element: withSuspense(InvoiceDetailPage) },

          // Procurement
          { path: "/procurement", element: withSuspense(ProcurementListPage) },
          { path: "/procurement/:id", element: withSuspense(ProcurementDetailPage) },

          // Trade-ins
          { path: "/tradeins", element: withSuspense(TradeInListPage) },
          { path: "/tradeins/:id", element: withSuspense(TradeInDetailPage) },

          // Service Requests
          { path: "/service-requests", element: withSuspense(ServiceRequestListPage) },
          { path: "/service-requests/:id", element: withSuspense(ServiceRequestDetailPage) },

          // Documents
          { path: "/documents", element: withSuspense(DocumentListPage) },

          // Notifications
          { path: "/notifications", element: withSuspense(NotificationListPage) },

          // Reports
          {
            element: <ProtectedRoute allowedRoles={["SUPER_ADMIN", "NAMRENT_ADMIN", "NAMRENT_OPS"]} />,
            children: [{ path: "/reports", element: withSuspense(ReportsPage) }],
          },

          // Users & Roles (NamRent admins only)
          {
            element: <ProtectedRoute allowedRoles={["SUPER_ADMIN", "NAMRENT_ADMIN"]} />,
            children: [{ path: "/users", element: withSuspense(UsersPage) }],
          },

          // Settings
          { path: "/settings", element: withSuspense(SettingsPage) },
        ],
      },
    ],
  },
]);
