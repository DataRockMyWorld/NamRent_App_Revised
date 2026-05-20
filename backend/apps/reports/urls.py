from django.urls import path
from .views import (
    ContractSummaryView,
    FleetSummaryView,
    InvoiceSummaryView,
    MaintenanceSummaryView,
)

urlpatterns = [
    path("fleet-summary/", FleetSummaryView.as_view(), name="report-fleet-summary"),
    path("invoice-summary/", InvoiceSummaryView.as_view(), name="report-invoice-summary"),
    path("maintenance-summary/", MaintenanceSummaryView.as_view(), name="report-maintenance-summary"),
    path("contract-summary/", ContractSummaryView.as_view(), name="report-contract-summary"),
]
