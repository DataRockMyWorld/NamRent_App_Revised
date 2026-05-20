from django.contrib import admin
from .models import DealerOffer, ProcurementRequest


class DealerOfferInline(admin.TabularInline):
    model = DealerOffer
    extra = 0
    fields = ["dealer", "vehicle_make", "vehicle_model", "vehicle_year", "offered_price", "status"]
    readonly_fields = ["id", "created_at"]
    raw_id_fields = ["dealer"]


@admin.register(ProcurementRequest)
class ProcurementRequestAdmin(admin.ModelAdmin):
    list_display = [
        "reference_number", "client", "vehicle_type",
        "quantity", "arrangement_type", "status", "submitted_at", "created_at",
    ]
    list_filter = ["status", "arrangement_type"]
    search_fields = ["reference_number", "client__company_name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["client", "reviewed_by", "selected_offer"]
    filter_horizontal = ["assigned_dealers"]
    inlines = [DealerOfferInline]


@admin.register(DealerOffer)
class DealerOfferAdmin(admin.ModelAdmin):
    list_display = [
        "dealer", "procurement_request", "trade_in_request",
        "vehicle_make", "vehicle_model", "vehicle_year",
        "offered_price", "status", "submitted_at",
    ]
    list_filter = ["status"]
    search_fields = ["dealer__dealer_name", "vehicle_make", "vehicle_model"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["dealer", "procurement_request", "trade_in_request"]
