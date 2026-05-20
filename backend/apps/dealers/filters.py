import django_filters
from .models import Dealer, DealerStatus


class DealerFilter(django_filters.FilterSet):
    dealer_status = django_filters.ChoiceFilter(choices=DealerStatus.choices)

    class Meta:
        model = Dealer
        fields = ["dealer_status"]
