import django_filters
from .models import MaintenanceRequest, MaintenanceStatus, Priority, RequestType


class MaintenanceFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=MaintenanceStatus.choices)
    priority = django_filters.ChoiceFilter(choices=Priority.choices)
    request_type = django_filters.ChoiceFilter(choices=RequestType.choices)
    client = django_filters.UUIDFilter(field_name="client__id")
    vehicle = django_filters.UUIDFilter(field_name="vehicle__id")

    class Meta:
        model = MaintenanceRequest
        fields = ["status", "priority", "request_type", "client", "vehicle"]
