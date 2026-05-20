import django_filters
from .models import TradeInRequest, TradeInStatus, VehicleCondition


class TradeInRequestFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=TradeInStatus.choices)
    client = django_filters.UUIDFilter(field_name="client__id")
    trade_in_condition = django_filters.ChoiceFilter(choices=VehicleCondition.choices)

    class Meta:
        model = TradeInRequest
        fields = ["status", "client", "trade_in_condition"]
