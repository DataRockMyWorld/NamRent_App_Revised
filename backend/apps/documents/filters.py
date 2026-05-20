import django_filters
from .models import Document, DocumentCategory, DocumentStatus


class DocumentFilter(django_filters.FilterSet):
    document_category = django_filters.ChoiceFilter(choices=DocumentCategory.choices)
    status = django_filters.ChoiceFilter(choices=DocumentStatus.choices)
    object_id = django_filters.UUIDFilter()
    expiry_before = django_filters.DateFilter(field_name="expiry_date", lookup_expr="lte")
    expiry_after = django_filters.DateFilter(field_name="expiry_date", lookup_expr="gte")

    class Meta:
        model = Document
        fields = ["document_category", "status", "object_id"]
