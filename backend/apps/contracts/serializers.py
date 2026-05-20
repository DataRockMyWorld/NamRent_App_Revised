from rest_framework import serializers
from common.serializers import BaseModelSerializer
from .models import Contract


class ContractListSerializer(BaseModelSerializer):
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    vehicle_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Contract
        fields = [
            "id", "contract_number", "client_name", "pathway_type",
            "start_date", "end_date", "monthly_fee",
            "status", "renewal_status", "vehicle_count", "created_at",
        ]


class ContractDetailSerializer(BaseModelSerializer):
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True, default=None)

    class Meta:
        model = Contract
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class ContractCreateUpdateSerializer(BaseModelSerializer):
    class Meta:
        model = Contract
        fields = [
            "contract_number", "client", "vehicles", "pathway_type",
            "start_date", "end_date", "duration_months", "monthly_fee",
            "services_included", "payment_schedule", "status",
            "signed_document", "renewal_status", "created_by", "notes",
        ]
