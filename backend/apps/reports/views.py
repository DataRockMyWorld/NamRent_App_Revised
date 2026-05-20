from django.db.models import Count, Sum, Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsNamRentStaff


class FleetSummaryView(APIView):
    permission_classes = [IsNamRentStaff]

    def get(self, request):
        from apps.vehicles.models import Vehicle, VehicleStatus

        qs = Vehicle.objects.all()
        summary = {
            "total": qs.count(),
            "by_status": {
                s: qs.filter(current_status=s).count()
                for s, _ in VehicleStatus.choices
            },
            "insurance_expiring_soon": qs.filter(
                insurance_expiry__lte=timezone.now().date() + timezone.timedelta(days=30),
                insurance_expiry__gte=timezone.now().date(),
            ).count(),
            "license_expiring_soon": qs.filter(
                license_expiry__lte=timezone.now().date() + timezone.timedelta(days=30),
                license_expiry__gte=timezone.now().date(),
            ).count(),
        }
        return Response(summary)


class InvoiceSummaryView(APIView):
    permission_classes = [IsNamRentStaff]

    def get(self, request):
        from apps.invoices.models import Invoice, InvoiceStatus

        qs = Invoice.objects.all()
        summary = {
            "total_invoices": qs.count(),
            "total_value": qs.aggregate(total=Sum("total_amount"))["total"] or 0,
            "by_status": {
                s: {
                    "count": qs.filter(status=s).count(),
                    "value": qs.filter(status=s).aggregate(t=Sum("total_amount"))["t"] or 0,
                }
                for s, _ in InvoiceStatus.choices
            },
            "overdue": {
                "count": qs.filter(status=InvoiceStatus.OVERDUE).count(),
                "value": qs.filter(status=InvoiceStatus.OVERDUE).aggregate(
                    t=Sum("total_amount")
                )["t"] or 0,
            },
        }
        return Response(summary)


class MaintenanceSummaryView(APIView):
    permission_classes = [IsNamRentStaff]

    def get(self, request):
        from apps.maintenance.models import MaintenanceRequest, MaintenanceStatus, Priority

        qs = MaintenanceRequest.objects.all()
        summary = {
            "total": qs.count(),
            "by_status": {
                s: qs.filter(status=s).count()
                for s, _ in MaintenanceStatus.choices
            },
            "by_priority": {
                p: qs.filter(priority=p).count()
                for p, _ in Priority.choices
            },
            "open": qs.exclude(
                status__in=["COMPLETED", "REJECTED", "CANCELLED"]
            ).count(),
        }
        return Response(summary)


class ContractSummaryView(APIView):
    permission_classes = [IsNamRentStaff]

    def get(self, request):
        from apps.contracts.models import Contract, ContractStatus

        qs = Contract.objects.all()
        today = timezone.now().date()
        summary = {
            "total": qs.count(),
            "by_status": {
                s: qs.filter(status=s).count()
                for s, _ in ContractStatus.choices
            },
            "expiring_soon": qs.filter(
                status=ContractStatus.ACTIVE,
                end_date__lte=today + timezone.timedelta(days=60),
                end_date__gte=today,
            ).count(),
        }
        return Response(summary)
