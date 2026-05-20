from rest_framework import serializers
from common.serializers import BaseModelSerializer
from apps.accounts.serializers import UserMeSerializer
from .models import Client, ClientUser


class ClientListSerializer(BaseModelSerializer):
    account_manager_name = serializers.CharField(
        source="assigned_account_manager.get_full_name", read_only=True, default=None
    )
    vehicle_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Client
        fields = [
            "id", "client_type", "company_name", "contact_person_name",
            "email", "phone", "city", "country",
            "kyc_status", "account_status",
            "account_manager_name", "vehicle_count", "created_at",
        ]


class ClientDetailSerializer(BaseModelSerializer):
    account_manager = UserMeSerializer(source="assigned_account_manager", read_only=True)

    class Meta:
        model = Client
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class ClientCreateUpdateSerializer(BaseModelSerializer):
    class Meta:
        model = Client
        fields = [
            "client_type", "company_name", "registration_number",
            "contact_person_name", "contact_person_title",
            "email", "phone", "alt_phone",
            "address_line_1", "address_line_2", "city", "province", "postal_code", "country",
            "kyc_status", "account_status", "assigned_account_manager", "notes",
        ]


class ClientUserSerializer(BaseModelSerializer):
    user = UserMeSerializer(read_only=True)

    class Meta:
        model = ClientUser
        fields = ["id", "user", "client", "is_admin", "department", "job_title", "created_at"]
        read_only_fields = ["id", "client", "created_at"]
