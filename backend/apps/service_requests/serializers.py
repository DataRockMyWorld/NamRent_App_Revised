from rest_framework import serializers
from common.serializers import BaseModelSerializer
from .models import ServiceRequest


class ServiceRequestListSerializer(BaseModelSerializer):
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    vehicle_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = ServiceRequest
        fields = [
            "id", "reference_number", "client_name",
            "selected_services", "duration_years", "status",
            "vehicle_count", "submitted_at", "created_at",
        ]


class ServiceRequestDetailSerializer(BaseModelSerializer):
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.get_full_name", read_only=True, default=None
    )

    class Meta:
        model = ServiceRequest
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class ServiceRequestCreateSerializer(BaseModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = ["reference_number", "client", "vehicles", "selected_services", "duration_years"]


class ServiceRequestUpdateSerializer(BaseModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = [
            "vehicles", "selected_services", "duration_years",
            "status", "reviewed_by", "review_notes",
            "submitted_at", "approved_at",
        ]
