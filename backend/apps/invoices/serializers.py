from rest_framework import serializers
from common.serializers import BaseModelSerializer
from .models import Invoice, InvoiceItem, PaymentRecord


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ["id", "item_type", "description", "quantity", "unit_price", "line_total"]
        read_only_fields = ["id", "line_total"]


class PaymentRecordSerializer(BaseModelSerializer):
    recorded_by_name = serializers.CharField(
        source="recorded_by.get_full_name", read_only=True, default=None
    )

    class Meta:
        model = PaymentRecord
        fields = [
            "id", "invoice", "amount_paid", "payment_date",
            "payment_method", "reference_number",
            "recorded_by_name", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class InvoiceListSerializer(BaseModelSerializer):
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    contract_number = serializers.CharField(source="contract.contract_number", read_only=True, default=None)

    class Meta:
        model = Invoice
        fields = [
            "id", "invoice_number", "client_name", "contract_number",
            "issue_date", "due_date", "total_amount",
            "status", "payment_date", "created_at",
        ]


class InvoiceDetailSerializer(BaseModelSerializer):
    client_name = serializers.CharField(source="client.company_name", read_only=True)
    contract_number = serializers.CharField(source="contract.contract_number", read_only=True, default=None)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True, default=None)
    items = InvoiceItemSerializer(many=True, read_only=True)
    payment_records = PaymentRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class InvoiceCreateUpdateSerializer(BaseModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)

    class Meta:
        model = Invoice
        fields = [
            "invoice_number", "client", "contract",
            "issue_date", "due_date", "period_start", "period_end",
            "subtotal", "vat_rate", "vat_amount", "total_amount",
            "status", "payment_method", "payment_date", "payment_reference",
            "notes", "created_by", "items",
        ]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        invoice = super().create(validated_data)
        for item in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item)
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        invoice = super().update(instance, validated_data)
        if items_data is not None:
            invoice.items.all().delete()
            for item in items_data:
                InvoiceItem.objects.create(invoice=invoice, **item)
        return invoice
