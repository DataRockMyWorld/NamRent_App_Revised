from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from common.permissions import IsNamRentAdmin, IsNamRentStaff
from .models import Vehicle, VehicleAssignment
from .serializers import (
    VehicleAssignmentSerializer,
    VehicleCreateUpdateSerializer,
    VehicleDetailSerializer,
    VehicleListSerializer,
)
from .filters import VehicleFilter


class VehicleViewSet(ModelViewSet):
    queryset = Vehicle.objects.select_related("assigned_client", "assigned_driver", "dealer_source")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VehicleFilter
    search_fields = ["registration_number", "make", "model", "vin"]
    ordering_fields = ["make", "model", "year", "created_at", "insurance_expiry", "license_expiry"]
    ordering = ["make", "model"]

    def get_permissions(self):
        if self.action in ("list", "retrieve", "vehicle_assignments"):
            return [IsNamRentStaff()]
        return [IsNamRentAdmin()]

    def get_serializer_class(self):
        if self.action == "list":
            return VehicleListSerializer
        if self.action in ("create", "update", "partial_update"):
            return VehicleCreateUpdateSerializer
        return VehicleDetailSerializer

    @action(detail=True, methods=["post"], url_path="assign")
    def assign_vehicle(self, request, pk=None):
        vehicle = self.get_object()
        serializer = VehicleAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            # Close any existing open assignment
            VehicleAssignment.objects.filter(vehicle=vehicle, end_date__isnull=True).update(
                end_date=serializer.validated_data["start_date"]
            )
            assignment = serializer.save(vehicle=vehicle, assigned_by=request.user)
            vehicle.assigned_client = assignment.client
            vehicle.assigned_driver = assignment.driver
            vehicle.save(update_fields=["assigned_client", "assigned_driver"])
        return Response(VehicleAssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="assignments")
    def vehicle_assignments(self, request, pk=None):
        vehicle = self.get_object()
        assignments = VehicleAssignment.objects.filter(vehicle=vehicle).select_related("client", "driver")
        serializer = VehicleAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
