from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsNamRentAdmin, IsNamRentStaff
from .filters import ContractFilter
from .models import Contract
from .serializers import (
    ContractCreateUpdateSerializer,
    ContractDetailSerializer,
    ContractListSerializer,
)


class ContractViewSet(ModelViewSet):
    queryset = Contract.objects.select_related("client", "created_by")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ContractFilter
    search_fields = ["contract_number", "client__company_name"]
    ordering_fields = ["contract_number", "start_date", "end_date", "created_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsNamRentStaff()]
        return [IsNamRentAdmin()]

    def get_serializer_class(self):
        if self.action == "list":
            return ContractListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ContractCreateUpdateSerializer
        return ContractDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "list":
            qs = qs.annotate(vehicle_count=Count("vehicles"))
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
