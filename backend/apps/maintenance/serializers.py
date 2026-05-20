from rest_framework import serializers
from common.serializers import BaseModelSerializer
from .models import MaintenanceRequest


class MaintenanceRequestListSerializer(BaseModelSerializer):
    vehicle_display = serializers.CharField(source="vehicle.__str__", read_only=True)
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    reported_by_name = serializers.CharField(
        source="reported_by.get_full_name", read_only=True, default=None
    )

    class Meta:
        model = MaintenanceRequest
        fields = [
            "id", "reference_number", "vehicle_display", "client_name",
            "request_type", "priority", "status",
            "reported_by_name", "scheduled_date", "created_at",
        ]


class MaintenanceRequestDetailSerializer(BaseModelSerializer):
    vehicle_display = serializers.CharField(source="vehicle.__str__", read_only=True)
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    reported_by_name = serializers.CharField(
        source="reported_by.get_full_name", read_only=True, default=None
    )
    assigned_officer_name = serializers.CharField(
        source="assigned_officer.get_full_name", read_only=True, default=None
    )

    class Meta:
        model = MaintenanceRequest
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class MaintenanceRequestCreateSerializer(BaseModelSerializer):
    class Meta:
        model = MaintenanceRequest
        fields = [
            "reference_number", "vehicle", "client",
            "request_type", "priority", "description",
            "location_description", "location_lat", "location_lng",
        ]


class MaintenanceRequestUpdateSerializer(BaseModelSerializer):
    class Meta:
        model = MaintenanceRequest
        fields = [
            "request_type", "priority", "description",
            "location_description", "location_lat", "location_lng",
            "assigned_officer", "service_provider_name", "service_provider_contact",
            "status", "cost_estimate", "final_cost",
            "scheduled_date", "completion_date", "completion_notes",
        ]
