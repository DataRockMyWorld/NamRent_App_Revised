from django.contrib import admin
from .models import ServiceRequest


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = [
        "reference_number", "client", "duration_years",
        "status", "submitted_at", "approved_at", "created_at",
    ]
    list_filter = ["status", "duration_years"]
    search_fields = ["reference_number", "client__company_name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["client", "reviewed_by"]
    filter_horizontal = ["vehicles"]
