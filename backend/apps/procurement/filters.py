import django_filters
from .models import DealerOffer, OfferStatus, ProcurementRequest, ProcurementStatus


class ProcurementRequestFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=ProcurementStatus.choices)
    client = django_filters.UUIDFilter(field_name="client__id")
    arrangement_type = django_filters.CharFilter(field_name="arrangement_type")

    class Meta:
        model = ProcurementRequest
        fields = ["status", "client", "arrangement_type"]


class DealerOfferFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=OfferStatus.choices)
    dealer = django_filters.UUIDFilter(field_name="dealer__id")
    procurement_request = django_filters.UUIDFilter(field_name="procurement_request__id")

    class Meta:
        model = DealerOffer
        fields = ["status", "dealer", "procurement_request"]
