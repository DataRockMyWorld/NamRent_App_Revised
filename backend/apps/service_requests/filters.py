import django_filters
from .models import ServiceRequest, ServiceRequestStatus


class ServiceRequestFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=ServiceRequestStatus.choices)
    client = django_filters.UUIDFilter(field_name="client__id")

    class Meta:
        model = ServiceRequest
        fields = ["status", "client"]
