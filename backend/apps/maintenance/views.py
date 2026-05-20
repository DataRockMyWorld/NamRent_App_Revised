from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsNamRentAdmin, IsNamRentStaff
from .filters import MaintenanceFilter
from .models import MaintenanceRequest
from .serializers import (
    MaintenanceRequestCreateSerializer,
    MaintenanceRequestDetailSerializer,
    MaintenanceRequestListSerializer,
    MaintenanceRequestUpdateSerializer,
)


class MaintenanceRequestViewSet(ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MaintenanceFilter
    search_fields = ["reference_number", "description"]
    ordering_fields = ["created_at", "priority", "status", "scheduled_date"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsNamRentAdmin()]
        if self.action in ("update", "partial_update"):
            return [IsNamRentStaff()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = MaintenanceRequest.objects.select_related(
            "vehicle", "client", "reported_by", "assigned_officer"
        )
        if user.is_client:
            qs = qs.filter(client__users__user=user)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return MaintenanceRequestListSerializer
        if self.action == "create":
            return MaintenanceRequestCreateSerializer
        if self.action in ("update", "partial_update"):
            return MaintenanceRequestUpdateSerializer
        return MaintenanceRequestDetailSerializer

    def perform_create(self, serializer):
        serializer.save(reported_by=self.request.user)
