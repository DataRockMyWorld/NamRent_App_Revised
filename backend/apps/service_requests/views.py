from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsNamRentAdmin, IsNamRentStaff
from .filters import ServiceRequestFilter
from .models import ServiceRequest
from .serializers import (
    ServiceRequestCreateSerializer,
    ServiceRequestDetailSerializer,
    ServiceRequestListSerializer,
    ServiceRequestUpdateSerializer,
)


class ServiceRequestViewSet(ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ServiceRequestFilter
    search_fields = ["reference_number", "client__company_name"]
    ordering_fields = ["created_at", "status", "submitted_at"]
    ordering = ["-created_at"]

    def get_permissions(self):
        if self.action == "destroy":
            return [IsNamRentAdmin()]
        if self.action in ("update", "partial_update"):
            return [IsNamRentStaff()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = ServiceRequest.objects.select_related("client", "reviewed_by")
        if user.is_client:
            qs = qs.filter(client__users__user=user)
        if self.action == "list":
            qs = qs.annotate(vehicle_count=Count("vehicles"))
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return ServiceRequestListSerializer
        if self.action == "create":
            return ServiceRequestCreateSerializer
        if self.action in ("update", "partial_update"):
            return ServiceRequestUpdateSerializer
        return ServiceRequestDetailSerializer
