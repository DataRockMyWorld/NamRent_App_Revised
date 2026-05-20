from rest_framework import serializers
from common.serializers import BaseModelSerializer
from .models import TradeInRequest, TradeInValuation


class TradeInValuationSerializer(BaseModelSerializer):
    dealer_name = serializers.CharField(source="dealer.dealer_name", read_only=True)
    submitted_by_name = serializers.CharField(
        source="submitted_by.get_full_name", read_only=True, default=None
    )

    class Meta:
        model = TradeInValuation
        fields = [
            "id", "trade_in_request", "dealer", "dealer_name",
            "estimated_value", "condition_notes", "is_accepted",
            "valuation_date", "submitted_by_name", "created_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TradeInValuationCreateSerializer(BaseModelSerializer):
    class Meta:
        model = TradeInValuation
        fields = [
            "trade_in_request", "dealer",
            "estimated_value", "condition_notes", "valuation_date",
        ]


class TradeInRequestListSerializer(BaseModelSerializer):
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    vehicle_display = serializers.CharField(source="trade_in_vehicle.__str__", read_only=True)

    class Meta:
        model = TradeInRequest
        fields = [
            "id", "reference_number", "client_name", "vehicle_display",
            "trade_in_condition", "status", "submitted_at", "created_at",
        ]


class TradeInRequestDetailSerializer(BaseModelSerializer):
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    vehicle_display = serializers.CharField(source="trade_in_vehicle.__str__", read_only=True)
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.get_full_name", read_only=True, default=None
    )
    valuations = TradeInValuationSerializer(many=True, read_only=True)

    class Meta:
        model = TradeInRequest
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class TradeInRequestCreateSerializer(BaseModelSerializer):
    class Meta:
        model = TradeInRequest
        fields = [
            "reference_number", "client", "trade_in_vehicle",
            "trade_in_mileage", "trade_in_condition", "trade_in_notes",
            "replacement_vehicle_type", "replacement_requirements",
            "selected_services", "duration_years",
        ]


class TradeInRequestUpdateSerializer(BaseModelSerializer):
    class Meta:
        model = TradeInRequest
        fields = [
            "trade_in_mileage", "trade_in_condition", "trade_in_notes",
            "replacement_vehicle_type", "replacement_requirements",
            "selected_services", "duration_years",
            "assigned_valuation_dealer", "accepted_valuation",
            "status", "reviewed_by", "submitted_at", "approved_at",
        ]
