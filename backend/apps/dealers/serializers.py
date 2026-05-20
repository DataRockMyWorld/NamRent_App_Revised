from rest_framework import serializers
from common.serializers import BaseModelSerializer
from .models import Dealer, DealerUser


class DealerListSerializer(BaseModelSerializer):
    class Meta:
        model = Dealer
        fields = [
            "id", "dealer_name", "contact_person", "email", "phone",
            "city", "country", "dealer_status", "brands_supplied", "created_at",
        ]


class DealerDetailSerializer(BaseModelSerializer):
    class Meta:
        model = Dealer
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class DealerCreateUpdateSerializer(BaseModelSerializer):
    class Meta:
        model = Dealer
        fields = [
            "dealer_name", "contact_person", "email", "phone",
            "address", "city", "province", "country",
            "dealer_status", "brands_supplied", "vat_number", "registration_number", "notes",
        ]


class DealerUserSerializer(BaseModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = DealerUser
        fields = ["id", "user_email", "user_name", "dealer", "is_primary", "created_at"]
        read_only_fields = ["id", "dealer", "created_at"]
