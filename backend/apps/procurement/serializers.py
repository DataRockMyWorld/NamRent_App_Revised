from rest_framework import serializers
from common.serializers import BaseModelSerializer
from .models import DealerOffer, ProcurementRequest


class DealerOfferSerializer(BaseModelSerializer):
    dealer_name = serializers.CharField(source="dealer.dealer_name", read_only=True)

    class Meta:
        model = DealerOffer
        fields = [
            "id", "dealer", "dealer_name",
            "vehicle_make", "vehicle_model", "vehicle_year", "vehicle_colour",
            "vehicle_type", "vin", "offered_price", "availability_date",
            "notes", "terms", "status", "submitted_at", "created_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DealerOfferCreateSerializer(BaseModelSerializer):
    class Meta:
        model = DealerOffer
        fields = [
            "procurement_request", "trade_in_request", "dealer",
            "vehicle_make", "vehicle_model", "vehicle_year", "vehicle_colour",
            "vehicle_type", "vin", "offered_price", "availability_date",
            "notes", "terms",
        ]


class ProcurementRequestListSerializer(BaseModelSerializer):
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    offer_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = ProcurementRequest
        fields = [
            "id", "reference_number", "client_name",
            "vehicle_type", "quantity", "arrangement_type",
            "status", "offer_count", "submitted_at", "created_at",
        ]


class ProcurementRequestDetailSerializer(BaseModelSerializer):
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.get_full_name", read_only=True, default=None
    )
    offers = DealerOfferSerializer(many=True, read_only=True)

    class Meta:
        model = ProcurementRequest
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class ProcurementRequestCreateSerializer(BaseModelSerializer):
    class Meta:
        model = ProcurementRequest
        fields = [
            "reference_number", "client", "vehicle_type", "vehicle_category",
            "quantity", "preferred_make", "preferred_model",
            "preferred_year_min", "preferred_year_max",
            "budget_min", "budget_max", "arrangement_type",
            "selected_services", "duration_years", "requirements_notes",
        ]


class ProcurementRequestUpdateSerializer(BaseModelSerializer):
    class Meta:
        model = ProcurementRequest
        fields = [
            "vehicle_type", "vehicle_category", "quantity",
            "preferred_make", "preferred_model",
            "preferred_year_min", "preferred_year_max",
            "budget_min", "budget_max", "arrangement_type",
            "selected_services", "duration_years", "requirements_notes",
            "assigned_dealers", "selected_offer",
            "status", "reviewed_by", "submitted_at", "approved_at",
        ]
