import django_filters
from .models import Invoice, InvoiceStatus


class InvoiceFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=InvoiceStatus.choices)
    client = django_filters.UUIDFilter(field_name="client__id")
    contract = django_filters.UUIDFilter(field_name="contract__id")
    due_date_before = django_filters.DateFilter(field_name="due_date", lookup_expr="lte")
    due_date_after = django_filters.DateFilter(field_name="due_date", lookup_expr="gte")

    class Meta:
        model = Invoice
        fields = ["status", "client", "contract"]
