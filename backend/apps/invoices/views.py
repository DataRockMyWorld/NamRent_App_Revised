from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsNamRentAdmin, IsNamRentStaff
from .filters import InvoiceFilter
from .models import Invoice, PaymentRecord
from .serializers import (
    InvoiceCreateUpdateSerializer,
    InvoiceDetailSerializer,
    InvoiceListSerializer,
    PaymentRecordSerializer,
)


class InvoiceViewSet(ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = InvoiceFilter
    search_fields = ["invoice_number", "client__company_name"]
    ordering_fields = ["invoice_number", "issue_date", "due_date", "total_amount", "status"]
    ordering = ["-issue_date"]

    def get_permissions(self):
        if self.action in ("list", "retrieve", "payments"):
            return [IsAuthenticated()]
        return [IsNamRentAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = Invoice.objects.select_related("client", "contract", "created_by")
        if user.is_client:
            qs = qs.filter(client__users__user=user)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return InvoiceListSerializer
        if self.action in ("create", "update", "partial_update"):
            return InvoiceCreateUpdateSerializer
        return InvoiceDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="payments")
    def record_payment(self, request, pk=None):
        invoice = self.get_object()
        serializer = PaymentRecordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(invoice=invoice, recorded_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="payments")
    def payments(self, request, pk=None):
        invoice = self.get_object()
        records = PaymentRecord.objects.filter(invoice=invoice)
        serializer = PaymentRecordSerializer(records, many=True)
        return Response(serializer.data)
