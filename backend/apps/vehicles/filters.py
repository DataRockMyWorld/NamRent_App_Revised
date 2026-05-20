import django_filters
from .models import Vehicle, VehicleType, VehicleStatus, OwnershipType


class VehicleFilter(django_filters.FilterSet):
    vehicle_type = django_filters.ChoiceFilter(choices=VehicleType.choices)
    current_status = django_filters.ChoiceFilter(choices=VehicleStatus.choices)
    ownership_type = django_filters.ChoiceFilter(choices=OwnershipType.choices)
    assigned_client = django_filters.UUIDFilter(field_name="assigned_client__id")
    insurance_expiry_before = django_filters.DateFilter(field_name="insurance_expiry", lookup_expr="lte")
    license_expiry_before = django_filters.DateFilter(field_name="license_expiry", lookup_expr="lte")

    class Meta:
        model = Vehicle
        fields = [
            "vehicle_type", "current_status", "ownership_type",
            "assigned_client", "insurance_expiry_before", "license_expiry_before",
        ]
