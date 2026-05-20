from django.contrib import admin
from .models import Contract


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = [
        "contract_number", "client", "pathway_type",
        "start_date", "end_date", "monthly_fee",
        "status", "renewal_status", "created_at",
    ]
    list_filter = ["status", "pathway_type", "payment_schedule", "renewal_status"]
    search_fields = ["contract_number", "client__company_name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["client", "created_by", "signed_document", "renewed_by_contract"]
    filter_horizontal = ["vehicles"]
