import django_filters
from .models import Contract, ContractStatus, PathwayType


class ContractFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=ContractStatus.choices)
    pathway_type = django_filters.ChoiceFilter(choices=PathwayType.choices)
    client = django_filters.UUIDFilter(field_name="client__id")
    end_date_before = django_filters.DateFilter(field_name="end_date", lookup_expr="lte")
    end_date_after = django_filters.DateFilter(field_name="end_date", lookup_expr="gte")

    class Meta:
        model = Contract
        fields = ["status", "pathway_type", "client"]
