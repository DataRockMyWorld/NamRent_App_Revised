from rest_framework import serializers
from common.serializers import BaseModelSerializer
from .models import Vehicle, VehicleAssignment


class VehicleListSerializer(BaseModelSerializer):
    client_name = serializers.CharField(source="assigned_client.company_name", read_only=True, default=None)
    driver_name = serializers.CharField(source="assigned_driver.get_full_name", read_only=True, default=None)

    class Meta:
        model = Vehicle
        fields = [
            "id", "registration_number", "make", "model", "year", "colour",
            "vehicle_type", "fuel_type", "transmission",
            "ownership_type", "current_status",
            "client_name", "driver_name",
            "insurance_expiry", "license_expiry",
            "created_at",
        ]


class VehicleDetailSerializer(BaseModelSerializer):
    client_name = serializers.CharField(source="assigned_client.company_name", read_only=True, default=None)
    driver_name = serializers.CharField(source="assigned_driver.get_full_name", read_only=True, default=None)
    dealer_name = serializers.CharField(source="dealer_source.dealer_name", read_only=True, default=None)

    class Meta:
        model = Vehicle
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class VehicleCreateUpdateSerializer(BaseModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            "registration_number", "vin", "make", "model", "year", "colour",
            "vehicle_type", "fuel_type", "transmission",
            "mileage", "mileage_last_updated",
            "ownership_type", "current_status",
            "assigned_client", "assigned_driver", "dealer_source",
            "insurance_provider", "insurance_policy_number", "insurance_start", "insurance_expiry",
            "license_number", "license_expiry",
            "tracking_provider", "tracking_device_id", "tracking_status", "tracking_renewal_date",
            "notes",
        ]


class VehicleAssignmentSerializer(BaseModelSerializer):
    vehicle_display = serializers.CharField(source="vehicle.__str__", read_only=True)
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    driver_name = serializers.CharField(source="driver.get_full_name", read_only=True, default=None)

    class Meta:
        model = VehicleAssignment
        fields = [
            "id", "vehicle", "vehicle_display", "client", "client_name",
            "driver", "driver_name", "start_date", "end_date", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
