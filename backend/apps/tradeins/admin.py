from django.contrib import admin
from .models import TradeInRequest, TradeInValuation


class TradeInValuationInline(admin.TabularInline):
    model = TradeInValuation
    extra = 0
    fields = ["dealer", "estimated_value", "condition_notes", "is_accepted", "valuation_date"]
    readonly_fields = ["id", "created_at"]
    raw_id_fields = ["dealer"]


@admin.register(TradeInRequest)
class TradeInRequestAdmin(admin.ModelAdmin):
    list_display = [
        "reference_number", "client", "trade_in_vehicle",
        "trade_in_condition", "status", "submitted_at", "created_at",
    ]
    list_filter = ["status", "trade_in_condition"]
    search_fields = ["reference_number", "client__company_name", "trade_in_vehicle__registration_number"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["client", "trade_in_vehicle", "reviewed_by", "assigned_valuation_dealer", "accepted_valuation"]
    inlines = [TradeInValuationInline]


@admin.register(TradeInValuation)
class TradeInValuationAdmin(admin.ModelAdmin):
    list_display = ["dealer", "trade_in_request", "estimated_value", "is_accepted", "valuation_date"]
    list_filter = ["is_accepted"]
    search_fields = ["dealer__dealer_name", "trade_in_request__reference_number"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["dealer", "trade_in_request", "submitted_by"]
