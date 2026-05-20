import django_filters
from .models import Client, KYCStatus, AccountStatus, ClientType


class ClientFilter(django_filters.FilterSet):
    kyc_status = django_filters.ChoiceFilter(choices=KYCStatus.choices)
    account_status = django_filters.ChoiceFilter(choices=AccountStatus.choices)
    client_type = django_filters.ChoiceFilter(choices=ClientType.choices)
    account_manager = django_filters.UUIDFilter(field_name="assigned_account_manager__id")

    class Meta:
        model = Client
        fields = ["kyc_status", "account_status", "client_type", "account_manager"]
